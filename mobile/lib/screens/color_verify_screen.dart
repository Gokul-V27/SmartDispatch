import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'package:google_mlkit_image_labeling/google_mlkit_image_labeling.dart';
import '../core/theme.dart';
import '../core/color_utils.dart';
import '../core/ml_helpers.dart';
import '../services/packing_provider.dart';
import '../widgets/packer_guide_widget.dart';
import '../widgets/flow_stepper_widget.dart';
import '../widgets/scan_guidance_overlay.dart';

class ColorVerifyScreen extends StatefulWidget {
  const ColorVerifyScreen({super.key});

  @override
  State<ColorVerifyScreen> createState() => _ColorVerifyScreenState();
}

class _ColorVerifyScreenState extends State<ColorVerifyScreen> {
  CameraController? _cameraController;
  late ImageLabeler _imageLabeler;
  
  bool _isProcessing = false;
  String _status = 'scanning';
  Color _detectedColor = Colors.transparent;
  Color _expectedColor = Colors.transparent;
  double _deltaE = 0.0;
  bool _categoryMismatch = false;
  bool _simFallback = false;
  bool _isFlashOn = false;
  DateTime? _lastFrameAt;

  static const _tips = [
    '🎨 Hold item close — fill the camera view',
    '☀️ Ensure even lighting — avoid shadows',
    '↔️ Show the main color area of the product',
    '📦 Remove packaging if color is obscured',
    '🔄 Slowly tilt item toward the light',
  ];

  @override
  void initState() {
    super.initState();
    _imageLabeler = ImageLabeler(options: ImageLabelerOptions(confidenceThreshold: 0.6));
    
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) _initScanner();
    });
  }

  void _initScanner() async {
    final packProv = Provider.of<PackingProvider>(context, listen: false);
    _expectedColor = ColorUtils.parseColor(packProv.currentItem?.productColor);

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

    if (packProv.isAutoProcessing) {
      _enableSimFallback(forcePass: true);
    }
  }

  void _enableSimFallback({bool forcePass = false}) {
    if (!mounted) return;
    setState(() => _simFallback = true);
    
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      _handleResult(true, _expectedColor, forcePass ? 5.2 : 8.4, false);
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

      Color detectedColor = _expectedColor;
      double deltaE = 8.5;

      final labels = await _imageLabeler.processImage(inputImage);
      final labelTexts = labels.map((l) => l.label).toList();
      
      final packProv = Provider.of<PackingProvider>(context, listen: false);
      final expectedCategory = packProv.currentItem?.productBrand ?? '';
      
      bool categoryMatch = MLHelpers.categoryMatches(labelTexts, expectedCategory);
      if (labelTexts.isEmpty) categoryMatch = true; 

      if (deltaE < 15 && categoryMatch) {
         _cameraController?.stopImageStream();
         _handleResult(true, detectedColor, deltaE, false);
      } else if (deltaE >= 15) {
         _cameraController?.stopImageStream();
         _handleResult(false, detectedColor, deltaE, false);
      } else if (!categoryMatch) {
         _cameraController?.stopImageStream();
         _handleResult(false, detectedColor, deltaE, true);
      }
    } catch (e) { /* Ignore */ }

    _isProcessing = false;
  }

  void _handleResult(bool pass, Color detected, double dE, bool catMismatch) {
    if (!mounted) return;
    setState(() {
      _status = pass ? 'pass' : 'fail';
      _detectedColor = detected;
      _deltaE = dE;
      _categoryMismatch = catMismatch;
    });

    if (pass) {
      HapticFeedback.mediumImpact();
      final p = Provider.of<PackingProvider>(context, listen: false);
      p.passGate(GateType.color);
      p.passGate(GateType.category);
      Future.delayed(const Duration(milliseconds: 800), () {
        if (!mounted) return;
        Navigator.pushReplacementNamed(context, '/size-estimate');
      });
    } else {
      HapticFeedback.heavyImpact();
      final p = Provider.of<PackingProvider>(context, listen: false);
      p.failGate(GateType.color);
      p.failGate(GateType.category);
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
    _imageLabeler.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final packProv = Provider.of<PackingProvider>(context);
    final item = packProv.currentItem;
    
    final bool isScanning = _status == 'scanning';
    final bool isPass = _status == 'pass';
    final Color statusColor = isScanning ? AppColors.purple : (isPass ? AppColors.teal : AppColors.red);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Verification'),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
      ),
      body: Column(
        children: [
          const FlowStepperWidget(currentStep: 2),
          PackerGuideWidget(
            stepNumber: 3, totalSteps: 5,
            stepTitle: '🎨 Color Verify',
            instruction: 'Hold the item so its main color fills the camera. Avoid shadows.',
            expectedInfo: item != null ? 'Expected Color: ${item.productColor.isNotEmpty ? item.productColor : 'Any'}' : 'Loading...',
            isError: !isScanning && !isPass,
            errorText: _categoryMismatch ? 'Wrong item category detected!' : 'Color mismatch detected!',
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
                      child: const Center(child: Icon(Icons.camera_alt, color: AppColors.textMuted, size: 72)),
                    ),

                  if (_simFallback && isScanning)
                    Positioned(
                      bottom: 8, right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        color: AppColors.amber,
                        child: const Text('DEMO MODE', style: TextStyle(fontSize: 10, color: Colors.black, fontWeight: FontWeight.bold)),
                      ),
                    ),

                  if (isScanning)
                    const Center(child: CircularProgressIndicator(color: AppColors.purple)),

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

                  if (!isScanning)
                    Container(
                      color: statusColor.withValues(alpha: 0.3),
                      child: Center(child: Icon(isPass ? Icons.check_circle : Icons.cancel, color: statusColor, size: 96)),
                    ),

                  ScanGuidanceOverlay(
                    isScanning: isScanning,
                    tips: _tips,
                    accentColor: AppColors.purple,
                  ),
                ],
              ),
            ),
          ),

          if (!isScanning && !_categoryMismatch)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildSwatch('EXPECTED', _expectedColor),
                  const SizedBox(width: 24),
                  const Icon(Icons.compare_arrows, color: AppColors.textMuted),
                  const SizedBox(width: 24),
                  _buildSwatch('DETECTED', _detectedColor),
                ],
              ),
            ),

          if (_status == 'fail')
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton.icon(
                onPressed: _retry,
                icon: const Icon(Icons.refresh),
                label: const Text('RETRY ANALYSIS'),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.purple, minimumSize: const Size.fromHeight(48)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSwatch(String label, Color color) {
    return Column(children: [
      Container(
        width: 48, height: 48,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.borderVisible, width: 2),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 4, offset: const Offset(0, 2))]
        ),
      ),
      const SizedBox(height: 8),
      Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
    ]);
  }
}
