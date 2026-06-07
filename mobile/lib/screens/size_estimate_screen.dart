import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'package:google_mlkit_object_detection/google_mlkit_object_detection.dart';
import '../core/theme.dart';
import '../core/ml_helpers.dart';
import '../services/packing_provider.dart';
import '../widgets/packer_guide_widget.dart';
import '../widgets/flow_stepper_widget.dart';
import '../widgets/scan_guidance_overlay.dart';
import '../core/arcore_measure_channel.dart';

class SizeEstimateScreen extends StatefulWidget {
  const SizeEstimateScreen({super.key});

  @override
  State<SizeEstimateScreen> createState() => _SizeEstimateScreenState();
}

class _SizeEstimateScreenState extends State<SizeEstimateScreen>
    with WidgetsBindingObserver {
  // ── Camera ────────────────────────────────────────────────────────────────
  CameraController? _cameraController;

  // ── ML Kit ────────────────────────────────────────────────────────────────
  ObjectDetector? _objectDetector;

  // ── ARCore ────────────────────────────────────────────────────────────────
  final _arChannel = ArCoreMeasureChannel();
  bool _arSupported = false;

  // ── Frame-processing guard ────────────────────────────────────────────────
  // volatile flags — set before any await, checked on re-entry
  bool _streamActive   = false;   // true only while startImageStream is live
  bool _isProcessing   = false;   // true while one frame is in-flight
  bool _disposed       = false;   // true after dispose()
  int  _lastFrameMs    = 0;

  // ── UI state ──────────────────────────────────────────────────────────────
  String _status       = 'scanning'; // scanning | measuring | pass | fail
  String _failReason   = '';
  String _detectedLabel = '';

  double _estLength = 0;
  double _estWidth  = 0;
  double _estHeight = 0;
  double _fitPct    = 0;

  bool _simFallback = false;
  bool _isFlashOn   = false;

  static const _tips = [
    '📏 Hold item at arm\'s length from camera',
    '📦 Place item on a flat, well-lit surface',
    '🔲 Keep the FULL item visible inside the frame',
    '💡 Move to a brighter area for better depth data',
    '🔄 Keep still while depth is captured',
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // TEMPORARY BYPASS: Instantly skip size check and proceed to next screen
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        Provider.of<PackingProvider>(context, listen: false).passGate(GateType.size);
        Navigator.pushReplacementNamed(context, '/item-confirm');
      }
    });
    return;

    // Lazily create the detector — heavy object, only one needed
    _objectDetector = ObjectDetector(
      options: ObjectDetectorOptions(
        mode: DetectionMode.single,
        classifyObjects: true,
        multipleObjects: false,
      ),
    );

    // Delay so any prior screen fully releases the camera hardware
    Future.delayed(const Duration(milliseconds: 1200), _initScanner);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Release camera when app backgrounds to avoid Surface leak
    if (state == AppLifecycleState.paused) {
      _stopStream();
    } else if (state == AppLifecycleState.resumed &&
        _status == 'scanning' && !_simFallback) {
      if (_cameraController == null) {
        _initScanner();
      } else {
        _startStream();
      }
    }
  }

  @override
  void dispose() {
    _disposed = true;
    WidgetsBinding.instance.removeObserver(this);
    _stopStream();
    // Delay actual dispose so any in-flight frame callback can finish
    Future.delayed(const Duration(milliseconds: 150), () {
      _cameraController?.dispose();
      _objectDetector?.close();
      _arChannel.dispose();
    });
    super.dispose();
  }

  // ── Stream start / stop helpers ───────────────────────────────────────────

  /// Start the image stream only if not already running.
  void _startStream() {
    if (_streamActive || _cameraController == null ||
        !_cameraController!.value.isInitialized) return;
    _streamActive = true;
    _cameraController!.startImageStream(_onFrame);
  }

  /// Stop the image stream and wait for any in-flight frame to finish.
  void _stopStream() {
    if (!_streamActive) return;
    _streamActive = false;
    try {
      _cameraController?.stopImageStream();
    } catch (_) {}
  }

  // ── Initialise ────────────────────────────────────────────────────────────

  void _initScanner() async {
    if (_disposed) return;

    // 1. ARCore depth (best-effort)
    // CRITICAL FIX: Only check support here. Do NOT init ARCore yet, or it grabs the camera.
    _arSupported = await _arChannel.checkSupported();

    // 2. Camera — Preview + ImageAnalysis only (NO ImageCapture)
    //    This removes the 1920×1440 idle surface that was causing GC pressure.
    if (MLHelpers.isPhysicalDevice()) {
      try {
        final cameras = await availableCameras();
        if (cameras.isNotEmpty) {
          _cameraController = CameraController(
            cameras.first,
            // low = 320×240 analysis; avoids the 1920×1440 ImageCapture surface
            ResolutionPreset.low,
            enableAudio: false,
            // Explicitly disable image capture to keep only Preview + Analysis
            imageFormatGroup: ImageFormatGroup.yuv420,
          );
          await _cameraController!.initialize();
          if (!_disposed && mounted) setState(() {});
          _startStream();
          return;
        }
      } catch (_) {}
    }

    if (!_disposed) _enableSimFallback();
    final packProv = Provider.of<PackingProvider>(context, listen: false);
    if (packProv.isAutoProcessing) _enableSimFallback(forcePass: true);
  }

  // ── Simulation fallback ───────────────────────────────────────────────────

  void _enableSimFallback({bool forcePass = false}) {
    if (_disposed || !mounted) return;
    setState(() => _simFallback = true);
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (_disposed || !mounted) return;
      final box = Provider.of<PackingProvider>(context, listen: false).selectedBox;
      if (box != null) {
        _handleResult(true, 22.0, 15.0, 8.0, forcePass ? 45.0 : 65.0, '');
      } else {
        _handleResult(false, 0, 0, 0, 0, 'No box selected');
      }
    });
  }

  // ── Frame processing ──────────────────────────────────────────────────────

  void _onFrame(CameraImage image) {
    // ── Guard 1: disposed or not in scanning state ─────────────────────────
    if (_disposed || !_streamActive || _status != 'scanning') return;

    // ── Guard 2: already processing a frame ───────────────────────────────
    if (_isProcessing) return;

    // ── Guard 3: throttle to max 1 frame per 900 ms (reduces LOS GC pressure) ───
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    if (nowMs - _lastFrameMs < 900) return;
    _lastFrameMs = nowMs;

    // Mark as processing BEFORE the first await so re-entrant frames see it
    _isProcessing = true;
    _processFrame(image).then((_) {
      _isProcessing = false;
    });
  }

  Future<void> _processFrame(CameraImage image) async {
    InputImage? inputImage;
    try {
      inputImage =
          MLHelpers.inputImageFromCameraImage(image, _cameraController);
      if (inputImage == null) return;

      final objects = await _objectDetector!.processImage(inputImage);
      if (_disposed || !_streamActive) return; // check again after await

      if (objects.isEmpty) return;

      final obj  = objects.first;
      final rect = obj.boundingBox;

      // Minimum 15 % frame coverage — avoids far/partial detections
      final imgW = (inputImage.metadata?.size.width  ?? 320).toDouble();
      final imgH = (inputImage.metadata?.size.height ?? 240).toDouble();
      if (rect.width / imgW < 0.15 || rect.height / imgH < 0.15) return;

      final label = obj.labels.isNotEmpty ? obj.labels.first.text : 'object';
      if (mounted) setState(() => _detectedLabel = label);

      // Stop the stream BEFORE the depth call so no more frames arrive
      _stopStream();
      if (mounted) setState(() => _status = 'measuring');

      await _measureWithDepth(rect, imgW.toInt(), imgH.toInt());

    } catch (_) {
      // Silently ignore frame errors — the stream keeps running
    }
    // inputImage is a value type in ML Kit Dart — no explicit release needed,
    // but we null it to allow GC of any underlying byte references quickly.
    inputImage = null;
  }

  // ── ARCore depth measurement ──────────────────────────────────────────────

  Future<void> _measureWithDepth(Rect bb, int imgW, int imgH) async {
    if (_disposed) return;

    ArMeasureResult result = ArMeasureResult.invalid('Unknown error');

    if (_arSupported) {
      // CRITICAL FIX: Dispose Flutter camera hardware so ARCore can grab it exclusively
      if (_cameraController != null) {
        await _cameraController!.dispose();
        _cameraController = null;
      }
      
      final initSuccess = await _arChannel.init();
      
      if (initSuccess) {
        // BLOCKING update mode means ARCore already has a fresh frame queued.
        // 300 ms is enough for the initial depth map to be valid.
        await Future.delayed(const Duration(milliseconds: 300));
        
        result = await _arChannel.measure(
          bbX1: bb.left.toInt(), bbY1: bb.top.toInt(),
          bbX2: bb.right.toInt(), bbY2: bb.bottom.toInt(),
          imageWidth: imgW, imageHeight: imgH,
        );
        
        // CRITICAL FIX: Release ARCore camera hardware so Flutter can reclaim it later
        await _arChannel.dispose();
      } else {
        result = ArMeasureResult.invalid('Failed to initialize ARCore session.');
      }

      if (!result.isValid) {
        if (!_disposed && mounted) {
          setState(() {
            _status     = 'fail';
            _failReason = '⚠️ Depth capture failed:\n${result.error}'
                '\n\nTry better lighting or move closer.';
          });
          HapticFeedback.heavyImpact();
        }
        return;
      }
    } else {
      // FOV-based fallback — arm-length (~55 cm), ~65° FOV → ~70 cm visible
      const fovCm   = 70.0;
      final pxPerCm = imgW / fovCm;
      final l = (bb.width  / pxPerCm).clamp(3.0, 120.0);
      final w = (bb.height / pxPerCm).clamp(3.0, 120.0);
      final h = (l * 0.15).clamp(1.0, 30.0);
      result = ArMeasureResult(lengthCm: l, widthCm: w, heightCm: h, isValid: true);
    }

    if (!_disposed && mounted) _evaluateFit(result);
  }

  // ── Fit evaluation ────────────────────────────────────────────────────────

  void _evaluateFit(ArMeasureResult r) {
    final packProv = Provider.of<PackingProvider>(context, listen: false);
    final box = packProv.selectedBox;
    if (box == null) {
      _handleResult(false, r.lengthCm, r.widthCm, r.heightCm, 0, 'No box selected');
      return;
    }

    final packedVol    = packProv.packedItems.fold(0.0, (sum, _) => sum + 2.0);
    final remainingVol = box.volL - packedVol;
    final fitPct       = ((packedVol + r.volumeL) / box.volL) * 100;

    // Sort ascending so we compare in the best orientation
    final item = [r.lengthCm, r.widthCm, r.heightCm]..sort();
    final bx   = [...box.dimsCm]..sort();

    final reasons = <String>[];
    if (item[2] > bx[2]) reasons.add('Longest side (${item[2].toStringAsFixed(1)} cm) > Box (${bx[2].toStringAsFixed(1)} cm)');
    if (item[1] > bx[1]) reasons.add('Middle side (${item[1].toStringAsFixed(1)} cm) > Box (${bx[1].toStringAsFixed(1)} cm)');
    if (item[0] > bx[0]) reasons.add('Shortest side (${item[0].toStringAsFixed(1)} cm) > Box (${bx[0].toStringAsFixed(1)} cm)');
    if (r.volumeL > remainingVol) {
      reasons.add('Volume (${r.volumeL.toStringAsFixed(2)} L) > Free space (${remainingVol.toStringAsFixed(2)} L)');
    }

    final note = 'Box Free Space: ${remainingVol.toStringAsFixed(1)} L';
    if (reasons.isEmpty) {
      _handleResult(true,  r.lengthCm, r.widthCm, r.heightCm, fitPct, note);
    } else {
      _handleResult(false, r.lengthCm, r.widthCm, r.heightCm, fitPct,
          '${reasons.join('\n')}\n\n$note');
    }
  }

  void _handleResult(bool pass, double l, double w, double h,
      double fitPct, String reason) {
    if (_disposed || !mounted) return;
    setState(() {
      _status       = pass ? 'pass' : 'fail';
      _estLength    = l;
      _estWidth     = w;
      _estHeight    = h;
      _fitPct       = fitPct;
      _failReason   = reason;
    });
    if (pass) {
      HapticFeedback.mediumImpact();
      Provider.of<PackingProvider>(context, listen: false).passGate(GateType.size);
      Future.delayed(const Duration(milliseconds: 800), () {
        if (!_disposed && mounted) {
          Navigator.pushReplacementNamed(context, '/item-confirm');
        }
      });
    } else {
      HapticFeedback.heavyImpact();
      Provider.of<PackingProvider>(context, listen: false).failGate(GateType.size);
    }
  }

  void _retry() {
    if (_disposed) return;
    setState(() { _status = 'scanning'; _detectedLabel = ''; });
    if (_simFallback) {
      _enableSimFallback();
    } else {
      if (_cameraController == null) {
        _initScanner();
      } else {
        _startStream();
      }
    }
  }

  void _toggleFlash() {
    if (_cameraController == null || !_cameraController!.value.isInitialized) return;
    setState(() => _isFlashOn = !_isFlashOn);
    _cameraController!.setFlashMode(_isFlashOn ? FlashMode.torch : FlashMode.off);
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final packProv    = Provider.of<PackingProvider>(context);
    final box         = packProv.selectedBox;
    final isScanning  = _status == 'scanning';
    final isMeasuring = _status == 'measuring';
    final isPass      = _status == 'pass';
    final statusColor = (isScanning || isMeasuring)
        ? AppColors.blue
        : (isPass ? AppColors.teal : AppColors.red);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Verification'),
        leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context)),
      ),
      body: Column(
        children: [
          const FlowStepperWidget(currentStep: 3),
          PackerGuideWidget(
            stepNumber: 4, totalSteps: 5,
            stepTitle: '📏 Size Check',
            instruction: isMeasuring
                ? '🔭 Capturing depth — hold still…'
                : 'Hold item at arm\'s length. Keep the FULL item visible.',
            expectedInfo: box != null
                ? 'Box: ${box.label} (${box.dimsCm[0]}×${box.dimsCm[1]}×${box.dimsCm[2]} cm)\n'
                  'Free: ${(box.volL - packProv.packedItems.length * 2.0).toStringAsFixed(1)} L'
                : 'Loading…',
            isError: !isScanning && !isMeasuring && !isPass,
            errorText: _failReason,
          ),

          Expanded(
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: statusColor, width: 3),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Stack(
                alignment: Alignment.center,
                fit: StackFit.expand,
                children: [
                  // Camera preview
                  if (!_simFallback &&
                      _cameraController != null &&
                      _cameraController!.value.isInitialized)
                    ClipRRect(
                        borderRadius: BorderRadius.circular(5),
                        child: CameraPreview(_cameraController!))
                  else
                    Container(
                      decoration: BoxDecoration(
                          color: Colors.black,
                          borderRadius: BorderRadius.circular(5)),
                      child: const Center(
                          child: Icon(Icons.straighten,
                              color: AppColors.textMuted, size: 72)),
                    ),

                  // DEMO badge
                  if (_simFallback && isScanning)
                    Positioned(
                      bottom: 48, right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        color: AppColors.amber,
                        child: const Text('DEMO MODE',
                            style: TextStyle(fontSize: 10, color: Colors.black,
                                fontWeight: FontWeight.bold)),
                      ),
                    ),

                  // ARCore badge
                  if (_arSupported && !_simFallback)
                    Positioned(
                      bottom: 8, right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.teal.withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('ARCore Depth',
                            style: TextStyle(fontSize: 10, color: Colors.white,
                                fontWeight: FontWeight.bold)),
                      ),
                    ),

                  // Scanning spinner
                  if (isScanning)
                    const Center(child: CircularProgressIndicator(color: AppColors.blue)),

                  // Depth-measuring overlay
                  if (isMeasuring)
                    Container(
                      color: Colors.black45,
                      child: Center(
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          const CircularProgressIndicator(color: AppColors.teal),
                          const SizedBox(height: 12),
                          Text(
                            _arSupported ? '🔭 Measuring depth…' : '📐 Estimating size…',
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                          ),
                        ]),
                      ),
                    ),

                  // Flash toggle
                  if (isScanning && !_simFallback)
                    Positioned(
                      top: 16, right: 16,
                      child: IconButton(
                        icon: Icon(_isFlashOn ? Icons.flash_on : Icons.flash_off),
                        color: Colors.white,
                        style: IconButton.styleFrom(backgroundColor: Colors.black54),
                        onPressed: _toggleFlash,
                      ),
                    ),

                  // Detected label badge
                  if (_detectedLabel.isNotEmpty && !isScanning)
                    Positioned(
                      top: 10, left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.75),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text('🔍 $_detectedLabel',
                            style: const TextStyle(color: Colors.white, fontSize: 11)),
                      ),
                    ),

                  // Pass highlight
                  if (!isScanning && !isMeasuring && isPass)
                    Positioned(child: Container(
                      width: 150, height: 100,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.teal, width: 2),
                        color: AppColors.teal.withValues(alpha: 0.2),
                      ),
                    )),

                  // Fail overlay
                  if (!isScanning && !isMeasuring && !isPass)
                    Container(
                      color: statusColor.withValues(alpha: 0.3),
                      child: Center(child: Icon(Icons.cancel, color: statusColor, size: 96)),
                    ),

                  ScanGuidanceOverlay(
                    isScanning: isScanning, tips: _tips, accentColor: AppColors.blue,
                  ),
                ],
              ),
            ),
          ),

          // Dimension readout
          if (!isScanning && !isMeasuring) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildDimCol('LENGTH', _estLength),
                  _buildDimCol('WIDTH',  _estWidth),
                  _buildDimCol('HEIGHT', _estHeight),
                ],
              ),
            ),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(children: [
                const Icon(Icons.view_in_ar, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(
                  'Item volume: ${((_estLength * _estWidth * _estHeight) / 1000).toStringAsFixed(2)} L',
                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                ),
              ]),
            ),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Box Fill',
                      style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  Text('${_fitPct.toStringAsFixed(0)}%',
                      style: TextStyle(fontSize: 11,
                          color: isPass ? AppColors.teal : AppColors.red,
                          fontWeight: FontWeight.bold)),
                ]),
                const SizedBox(height: 6),
                Container(
                  height: 6, width: double.infinity,
                  decoration: BoxDecoration(
                      color: AppColors.surface, borderRadius: BorderRadius.circular(3)),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: (_fitPct / 100).clamp(0.0, 1.0),
                    child: Container(decoration: BoxDecoration(
                        color: isPass ? AppColors.teal : AppColors.red,
                        borderRadius: BorderRadius.circular(3))),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 8),
          ],

          // Actions
          if (!isScanning && !isMeasuring && !isPass) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: ElevatedButton.icon(
                onPressed: _retry,
                icon: const Icon(Icons.refresh),
                label: const Text('RETRY SCAN'),
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blue,
                    minimumSize: const Size.fromHeight(44)),
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: ElevatedButton.icon(
                onPressed: () => Navigator.pushNamedAndRemoveUntil(
                    context, '/box-selector', (r) => r.isFirst),
                icon: const Icon(Icons.inventory_2),
                label: const Text('RECOMMEND LARGER BOX'),
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.red,
                    minimumSize: const Size.fromHeight(44)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDimCol(String label, double val) {
    return Column(children: [
      Text(label,
          style: const TextStyle(fontFamily: 'JetBrains Mono',
              fontSize: 10, color: AppColors.textMuted)),
      const SizedBox(height: 4),
      Text('${val.toStringAsFixed(1)} cm',
          style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14,
              color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
    ]);
  }
}
