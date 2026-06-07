// ============================================================
// box_damage_screen.dart  —  v2.0  (Nord 4 Optimised)
//
// CHANGES FROM v1
// ────────────────────────────────────────────────────────────
// • Consumes DamageReport.whiteBox → displays "WHITE BOX" or
//   "BROWN BOX" badge in the result section.
// • Confidence row also shows the adaptive detection mode
//   (Sobel-white / Sobel-brown / AI+Sobel) for QA visibility.
// • Phase label uses a monospaced chip so status messages with
//   varying lengths don't cause layout jitter on short strings.
// • Fix #11 (portrait lock) and Fix #12 (stale preview clear)
//   preserved exactly.
//
// GATE LOGIC (unchanged from v1):
//   intact  → passGate → auto-navigate to /ocr-scan  ✅
//   warning → passGate → yellow notice, then navigate  ✅
//   damaged → failGate → reject / rescan buttons       ❌
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';

import '../core/theme.dart';
import '../services/damage_detection_service.dart';
import '../services/packing_provider.dart';
import '../widgets/packer_guide_widget.dart';
import '../widgets/flow_stepper_widget.dart';
import '../widgets/scan_guidance_overlay.dart';

class BoxDamageScreen extends StatefulWidget {
  const BoxDamageScreen({super.key});

  @override
  State<BoxDamageScreen> createState() => _BoxDamageScreenState();
}

class _BoxDamageScreenState extends State<BoxDamageScreen> {
  late final DamageDetectionService _service;

  String _statusMsg  = 'Initialising…';
  DamageReport? _report;
  bool _isInit    = false;
  bool _isScanning = true;

  static const _tips = [
    '📦 Slowly pan camera over each side of the box',
    '🔍 Check corners and edges for dents or tears',
    '💧 Look for wet patches or stains on the surface',
    '↔️ Tilt the box toward the light for better visibility',
    '✋ Press lightly on sides — soft spots mean damage',
  ];

  // ── Lifecycle ─────────────────────────────────────────────

  @override
  void initState() {
    super.initState();

    // Fix #11 — lock portrait; Nord 4 sensor orientation is 90°
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

    _service = DamageDetectionService();
    _service.progress.listen((msg) {
      if (mounted) setState(() => _statusMsg = msg);
    });

    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) _start();
    });
  }

  @override
  void dispose() {
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    _service.dispose();
    super.dispose();
  }

  // ── Start / Rescan ────────────────────────────────────────

  Future<void> _start() async {
    setState(() {
      _isScanning = true;
      _report     = null;
      _statusMsg  = 'Initialising camera…';
      _isInit     = false; // Fix #12 — clear stale preview on Rescan
    });

    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        if (mounted) {
          setState(() {
            _statusMsg  = 'No cameras found';
            _isScanning = false;
          });
        }
        return;
      }

      await _service.initCamera(cameras[0]);
      await _service.loadModel(); // safe even when model is absent

      if (mounted) setState(() => _isInit = true);

      final report = await _service.runDetection();
      if (!mounted) return;

      setState(() {
        _report     = report;
        _isScanning = false;
      });

      if (report.passes) {
        HapticFeedback.mediumImpact();
        Provider.of<PackingProvider>(context, listen: false)
            .passGate(GateType.boxIntegrity);
        // Eagerly release camera hardware to prevent lock contention on the next screen
        try { await _service.cameraController?.stopImageStream(); } catch (_) {}
        await _service.cameraController?.dispose();

        Future.delayed(const Duration(milliseconds: 1500), () {
          if (mounted) Navigator.pushReplacementNamed(context, '/ocr-scan');
        });
      } else {
        HapticFeedback.heavyImpact();
        Provider.of<PackingProvider>(context, listen: false)
            .failGate(GateType.boxIntegrity);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _statusMsg  = 'Error: $e';
          _isScanning = false;
        });
      }
    }
  }

  // ── Helpers ───────────────────────────────────────────────

  Color get _statusColor {
    if (_isScanning) return AppColors.blue;
    return switch (_report?.level) {
      DamageLevel.intact  => AppColors.teal,
      DamageLevel.warning => AppColors.amber,
      DamageLevel.damaged => AppColors.red,
      null                => AppColors.blue,
    };
  }

  /// Human-readable detection mode shown under confidence.
  String _detectionMode(DamageReport r) {
    if (r.modelUsed) return 'AI + Sobel';
    return r.whiteBox ? 'Sobel · white box' : 'Sobel · brown box';
  }

  // ── Build ─────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final packProv = Provider.of<PackingProvider>(context);
    final box      = packProv.selectedBox;
    final passes   = _report?.passes ?? false;
    final color    = _statusColor;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Box Inspection'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [

          // ── Step indicator ────────────────────────────────
          const FlowStepperWidget(currentStep: 0),

          // ── Guide card ────────────────────────────────────
          PackerGuideWidget(
            stepNumber:   1,
            totalSteps:   5,
            stepTitle:    '📦 Box Integrity',
            instruction:  'Scan the exterior of the box for damage.',
            expectedInfo: box != null ? 'Selected Box: ${box.label}' : 'Loading…',
            isError:  !_isScanning && _report?.level == DamageLevel.damaged,
            errorText: _report?.message ?? _statusMsg,
          ),

          // ── Camera viewport ───────────────────────────────
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: color, width: 3),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Stack(
                alignment: Alignment.center,
                fit: StackFit.expand,
                children: [

                  // Camera preview
                  if (_isInit &&
                      _service.cameraController != null &&
                      _service.cameraController!.value.isInitialized)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(5),
                      child: CameraPreview(_service.cameraController!),
                    )
                  else
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: const Center(
                        child: Icon(Icons.inventory_2_outlined,
                            color: AppColors.textMuted, size: 72),
                      ),
                    ),

                  // Scanning spinner
                  if (_isScanning)
                    const Center(
                      child: CircularProgressIndicator(color: AppColors.blue),
                    ),

                  // Flashlight toggle
                  if (_isScanning && _isInit)
                    Positioned(
                      top: 16, right: 16,
                      child: IconButton(
                        icon: Icon(_service.isFlashOn
                            ? Icons.flash_on
                            : Icons.flash_off),
                        color: Colors.white,
                        style: IconButton.styleFrom(
                            backgroundColor: Colors.black54),
                        onPressed: () => setState(() => _service.toggleFlash()),
                      ),
                    ),

                  // Result overlay (icon + tinted background)
                  if (!_isScanning)
                    Container(
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: Center(
                        child: Icon(
                          switch (_report?.level) {
                            DamageLevel.intact  => Icons.check_circle,
                            DamageLevel.warning => Icons.warning_amber_rounded,
                            DamageLevel.damaged => Icons.cancel,
                            null                => Icons.hourglass_empty,
                          },
                          color: color,
                          size: 96,
                        ),
                      ),
                    ),

                  // Animated tips during scan
                  if (_isScanning)
                    ScanGuidanceOverlay(
                      isScanning:  _isScanning,
                      tips:        _tips,
                      accentColor: AppColors.blue,
                    ),

                  // Live phase label — fixed-height chip avoids layout jitter
                  if (_isScanning)
                    Positioned(
                      bottom: 24, left: 16, right: 16,
                      child: Container(
                        height: 44,
                        alignment: Alignment.center,
                        padding: const EdgeInsets.symmetric(
                            vertical: 8, horizontal: 16),
                        decoration: BoxDecoration(
                          color: Colors.black87,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _statusMsg,
                          textAlign: TextAlign.center,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 14),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // ── Result section ────────────────────────────────
          if (!_isScanning) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [

                  // Primary result label
                  Text(
                    switch (_report?.level) {
                      DamageLevel.intact  => 'BOX INTEGRITY VERIFIED',
                      DamageLevel.warning => 'LIGHT DAMAGE — ACCEPTABLE',
                      DamageLevel.damaged => 'DAMAGE DETECTED',
                      null                => '',
                    },
                    style: TextStyle(
                      fontFamily:  'JetBrains Mono',
                      fontSize:    16,
                      fontWeight:  FontWeight.bold,
                      color:       color,
                    ),
                  ),

                  const SizedBox(height: 6),

                  // Human-readable detail
                  if (_report != null)
                    Text(
                      _report!.message,
                      style: const TextStyle(
                          fontSize: 14, color: AppColors.textPrimary),
                      textAlign: TextAlign.center,
                    ),

                  const SizedBox(height: 6),

                  // Confidence + detection metadata row
                  if (_report != null)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Box colour badge ── new in v2
                        _BoxTypeBadge(isWhite: _report!.whiteBox),
                        const SizedBox(width: 8),
                        Text(
                          'Confidence: '
                          '${(_report!.confidence * 100).toStringAsFixed(1)}%'
                          '  ·  ${_detectionMode(_report!)}',
                          style: const TextStyle(
                            fontFamily: 'JetBrains Mono',
                            fontSize:   11,
                            color:      AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 16),

          // ── Actions — only shown on hard rejection ─────────
          if (!_isScanning && _report?.level == DamageLevel.damaged) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.refresh),
                label: const Text('REJECT BOX — SELECT ANOTHER'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.red,
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: OutlinedButton.icon(
                onPressed: _start,
                icon: const Icon(Icons.camera_alt),
                label: const Text('RESCAN BOX'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.textPrimary,
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ),
          ],

          if (!_isScanning && passes) const SizedBox(height: 64),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// BOX TYPE BADGE  (new in v2)
//
// Small pill showing whether the adaptive algorithm detected a
// white or brown box.  Useful for QA — confirms the detection
// mode in use and can help diagnose false positives.
// ─────────────────────────────────────────────────────────────

class _BoxTypeBadge extends StatelessWidget {
  final bool isWhite;
  const _BoxTypeBadge({required this.isWhite});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: isWhite
            ? Colors.grey.shade200.withValues(alpha: 0.15)
            : Colors.brown.shade300.withValues(alpha: 0.20),
        border: Border.all(
          color: isWhite ? Colors.grey.shade400 : Colors.brown.shade400,
          width: 0.8,
        ),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        isWhite ? 'WHITE BOX' : 'BROWN BOX',
        style: TextStyle(
          fontFamily: 'JetBrains Mono',
          fontSize:   10,
          color: isWhite ? Colors.grey.shade300 : Colors.brown.shade300,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
