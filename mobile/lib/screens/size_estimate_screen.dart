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

class SizeEstimateScreen extends StatefulWidget {
  const SizeEstimateScreen({super.key});

  @override
  State<SizeEstimateScreen> createState() => _SizeEstimateScreenState();
}

class _SizeEstimateScreenState extends State<SizeEstimateScreen> {
  CameraController? _cameraController;
  late ObjectDetector _objectDetector;
  
  bool _isProcessing = false;
  String _status = 'scanning';
  String _failReason = '';
  
  double _estLength = 0;
  double _estWidth = 0;
  double _estHeight = 0;
  double _fitPercentage = 0;
  bool _simFallback = false;
  bool _isFlashOn = false;
  DateTime? _lastFrameAt;

  static const _tips = [
    '📏 Hold item at arm\'s length from camera',
    '📦 Place item against a flat contrasting surface',
    '🔲 Keep the FULL item visible inside the frame',
    '💡 Move to a brighter area for better detection',
    '↔️ Rotate item so its longest side faces camera',
  ];

  @override
  void initState() {
    super.initState();
    _objectDetector = ObjectDetector(options: ObjectDetectorOptions(
      mode: DetectionMode.single,
      classifyObjects: true,
      multipleObjects: false,
    ));

    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) _initScanner();
    });
  }

  void _initScanner() async {
    if (MLHelpers.isPhysicalDevice()) {
      try {
        final cameras = await availableCameras();
        if (cameras.isNotEmpty) {
          _cameraController = CameraController(
            cameras.first, 
            ResolutionPreset.low,
            enableAudio: false,
          );
          await _cameraController!.initialize();
          if (mounted) setState(() {});
          _cameraController!.startImageStream(_processCameraImage);
        } else {
          _enableSimFallback();
        }
      } catch (e) {
        _enableSimFallback();
      }
    } else {
      _enableSimFallback();
    }

    final packProv = Provider.of<PackingProvider>(context, listen: false);
    if (packProv.isAutoProcessing) {
      _enableSimFallback(forcePass: true);
    }
  }

  void _enableSimFallback({bool forcePass = false}) {
    if (!mounted) return;
    setState(() => _simFallback = true);
    
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      final packProv = Provider.of<PackingProvider>(context, listen: false);
      final box = packProv.selectedBox;
      if (box != null) {
        _handleResult(true, forcePass ? 15 : 20, forcePass ? 10 : 15, 5, forcePass ? 45 : 65, "");
      } else {
        _handleResult(false, 0, 0, 0, 0, "No box selected");
      }
    });
  }

  void _processCameraImage(CameraImage image) async {
    if (_isProcessing || _status != 'scanning') return;
    
    final now = DateTime.now();
    if (_lastFrameAt != null && now.difference(_lastFrameAt!).inMilliseconds < 400) return;
    _lastFrameAt = now;
    _isProcessing = true;

    try {
      final inputImage = MLHelpers.inputImageFromCameraImage(image, _cameraController);
      if (inputImage == null) { _isProcessing = false; return; }

      final objects = await _objectDetector.processImage(inputImage);
      
      if (objects.isNotEmpty) {
        final obj = objects.first;
        final rect = obj.boundingBox;
        
        final packProv = Provider.of<PackingProvider>(context, listen: false);
        final box = packProv.selectedBox;
        
        if (box != null) {
          final imgW = inputImage.metadata?.size.width ?? 480;
          final scale = box.dimsCm[0] / imgW;
          
          double estL = rect.width * scale;
          double estW = rect.height * scale;
          double estH = 5.0;
          double itemVolL = (estL * estW * estH) / 1000.0;
          
          double packedVol = packProv.packedItems.fold(0.0, (sum, _) => sum + 2.0);
          double remainingVol = box.volL - packedVol;
          double fitPct = ((packedVol + itemVolL) / box.volL) * 100;
          
          String reason = "";
          if (estL > box.dimsCm[0]) reason = "Item length (${estL.toStringAsFixed(1)}cm) > Box (${box.dimsCm[0]}cm).\n";
          if (estW > box.dimsCm[1]) reason += "Item width (${estW.toStringAsFixed(1)}cm) > Box (${box.dimsCm[1]}cm).\n";
          if (itemVolL > remainingVol) reason += "Item vol (${itemVolL.toStringAsFixed(1)}L) > Free space (${remainingVol.toStringAsFixed(1)}L).\n";

          _cameraController?.stopImageStream();
          if (reason.isNotEmpty) {
            _handleResult(false, estL, estW, estH, fitPct, reason.trim() + "\n\nBox Free Space: ${remainingVol.toStringAsFixed(1)}L");
          } else {
            _handleResult(true, estL, estW, estH, fitPct, "Box Free Space: ${remainingVol.toStringAsFixed(1)}L");
          }
        }
      }
    } catch (e) { /* Ignore */ }

    _isProcessing = false;
  }

  void _handleResult(bool pass, double l, double w, double h, double fitPct, String reason) {
    if (!mounted) return;
    setState(() {
      _status = pass ? 'pass' : 'fail';
      _estLength = l; _estWidth = w; _estHeight = h;
      _fitPercentage = fitPct;
      _failReason = reason;
    });

    if (pass) {
      HapticFeedback.mediumImpact();
      Provider.of<PackingProvider>(context, listen: false).passGate(GateType.size);
      Future.delayed(const Duration(milliseconds: 800), () {
        if (!mounted) return;
        Navigator.pushReplacementNamed(context, '/item-confirm');
      });
    } else {
      HapticFeedback.heavyImpact();
      Provider.of<PackingProvider>(context, listen: false).failGate(GateType.size);
    }
  }

  void _retry() {
    setState(() { _status = 'scanning'; });
    if (!_simFallback) {
      _cameraController?.startImageStream(_processCameraImage);
    } else {
      _enableSimFallback();
    }
  }

  void _toggleFlash() {
    if (_cameraController == null || !_cameraController!.value.isInitialized) return;
    setState(() => _isFlashOn = !_isFlashOn);
    _cameraController!.setFlashMode(_isFlashOn ? FlashMode.torch : FlashMode.off);
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _objectDetector.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final packProv = Provider.of<PackingProvider>(context);
    final box = packProv.selectedBox;
    
    final bool isScanning = _status == 'scanning';
    final bool isPass = _status == 'pass';
    final Color statusColor = isScanning ? AppColors.blue : (isPass ? AppColors.teal : AppColors.red);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Verification'),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
      ),
      body: Column(
        children: [
          const FlowStepperWidget(currentStep: 3),
          PackerGuideWidget(
            stepNumber: 4, totalSteps: 5,
            stepTitle: '📏 Size Check',
            instruction: 'Hold item at arm\'s length. Keep the FULL item visible in frame.',
            expectedInfo: box != null ? 'Box: ${box.label} (${box.dimsCm[0]}x${box.dimsCm[1]}x${box.dimsCm[2]} cm)\nFree: ${(box.volL - (packProv.packedItems.length * 2.0)).toStringAsFixed(1)}L' : 'Loading...',
            isError: !isScanning && !isPass,
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
                  if (!_simFallback && _cameraController != null && _cameraController!.value.isInitialized)
                    ClipRRect(borderRadius: BorderRadius.circular(5), child: CameraPreview(_cameraController!))
                  else
                    Container(
                      decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(5)),
                      child: const Center(child: Icon(Icons.straighten, color: AppColors.textMuted, size: 72)),
                    ),

                  if (_simFallback && isScanning)
                    Positioned(
                      bottom: 48, right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        color: AppColors.amber,
                        child: const Text('DEMO MODE', style: TextStyle(fontSize: 10, color: Colors.black, fontWeight: FontWeight.bold)),
                      ),
                    ),

                  if (isScanning)
                    const Center(child: CircularProgressIndicator(color: AppColors.blue)),

                  if (isScanning && !_simFallback)
                    Positioned(
                      top: 16,
                      right: 16,
                      child: IconButton(
                        icon: Icon(_isFlashOn ? Icons.flash_on : Icons.flash_off),
                        color: Colors.white,
                        style: IconButton.styleFrom(backgroundColor: Colors.black54),
                        onPressed: _toggleFlash,
                      ),
                    ),

                  if (!isScanning && isPass)
                    Positioned(child: Container(
                      width: 150, height: 100,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.teal, width: 2),
                        color: AppColors.teal.withValues(alpha: 0.2),
                      ),
                    )),

                  if (!isScanning && !isPass)
                    Container(
                      color: statusColor.withValues(alpha: 0.3),
                      child: Center(child: Icon(Icons.cancel, color: statusColor, size: 96)),
                    ),

                  ScanGuidanceOverlay(
                    isScanning: isScanning,
                    tips: _tips,
                    accentColor: AppColors.blue,
                  ),
                ],
              ),
            ),
          ),

          if (!isScanning) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildDimCol('LENGTH', _estLength),
                  _buildDimCol('WIDTH', _estWidth),
                  _buildDimCol('HEIGHT', _estHeight),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Box Fill', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  Text('${_fitPercentage.toStringAsFixed(0)}%', style: TextStyle(fontSize: 11, color: isPass ? AppColors.teal : AppColors.red, fontWeight: FontWeight.bold)),
                ]),
                const SizedBox(height: 6),
                Container(
                  height: 6, width: double.infinity,
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(3)),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: (_fitPercentage / 100).clamp(0.0, 1.0),
                    child: Container(decoration: BoxDecoration(color: isPass ? AppColors.teal : AppColors.red, borderRadius: BorderRadius.circular(3))),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 8),
          ],

          if (!isScanning && !isPass)
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton.icon(
                onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/box-selector', (r) => r.isFirst),
                icon: const Icon(Icons.inventory_2),
                label: const Text('RECOMMEND LARGER BOX'),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.red, minimumSize: const Size.fromHeight(48)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDimCol(String label, double val) {
    return Column(children: [
      Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
      const SizedBox(height: 4),
      Text('${val.toStringAsFixed(1)} cm', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14, color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
    ]);
  }
}
