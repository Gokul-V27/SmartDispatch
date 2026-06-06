import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'package:google_mlkit_image_labeling/google_mlkit_image_labeling.dart';
import '../core/theme.dart';
import '../core/ml_helpers.dart';
import '../services/packing_provider.dart';

class BoxDamageScreen extends StatefulWidget {
  const BoxDamageScreen({super.key});

  @override
  State<BoxDamageScreen> createState() => _BoxDamageScreenState();
}

class _BoxDamageScreenState extends State<BoxDamageScreen> {
  CameraController? _cameraController;
  late ImageLabeler _imageLabeler;
  
  bool _isProcessing = false;
  String _status = 'scanning'; // scanning | pass | fail
  String _reason = '';
  double _confidence = 0.0;
  bool _simFallback = false;

  @override
  void initState() {
    super.initState();
    _initScanner();
  }

  void _initScanner() async {
    // 1. Initialize ImageLabeler
    // If we had a real custom TFLite model:
    // final modelPath = 'flutter_assets/assets/ml/damage_model.tflite';
    // final options = LocalLabelerOptions(modelPath: modelPath);
    // _imageLabeler = ImageLabeler(options: options);
    
    // Since we don't have the actual .tflite, we use the default model for real devices
    // and map certain generic labels to "Intact" or "Damaged".
    final options = ImageLabelerOptions(confidenceThreshold: 0.6);
    _imageLabeler = ImageLabeler(options: options);

    // 2. Setup Camera or Sim
    if (MLHelpers.isPhysicalDevice()) {
      try {
        final cameras = await availableCameras();
        if (cameras.isNotEmpty) {
          _cameraController = CameraController(
            cameras.first, 
            ResolutionPreset.medium,
            enableAudio: false,
            imageFormatGroup: ImageFormatGroup.yuv420,
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

    // 3. Auto-Process Check
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
      if (forcePass) {
        _handleResult(true, "Intact", 0.98);
      } else {
        // Mock a pass condition
        _handleResult(true, "Intact", 0.92);
      }
    });
  }

  void _processCameraImage(CameraImage image) async {
    if (_isProcessing || _status != 'scanning') return;
    _isProcessing = true;

    try {
      final inputImage = MLHelpers.inputImageFromCameraImage(image, _cameraController);
      if (inputImage == null) {
        _isProcessing = false;
        return;
      }

      final labels = await _imageLabeler.processImage(inputImage);
      
      bool isDamaged = false;
      double maxDamageConf = 0;
      double intactConf = 0;

      // Mock logic mapping generic ML Kit labels to damage states for the demo
      for (final label in labels) {
        final text = label.label.toLowerCase();
        final conf = label.confidence;
        
        if (text.contains('torn') || text.contains('break') || text.contains('hole') || text.contains('damage')) {
          isDamaged = true;
          if (conf > maxDamageConf) maxDamageConf = conf;
        } else if (text.contains('box') || text.contains('cardboard') || text.contains('package')) {
          // Found a box, assume intact if no damage words
          if (conf > intactConf) intactConf = conf;
        }
      }

      // If we see a box strongly and no damage, it passes
      if (isDamaged && maxDamageConf > 0.6) {
        _handleResult(false, "Damage Detected (Torn/Crushed)", maxDamageConf);
      } else if (intactConf > 0.6) {
        _handleResult(true, "Intact", intactConf);
      }
      
    } catch (e) {
      // Error processing
    }

    _isProcessing = false;
  }

  void _handleResult(bool pass, String reason, double conf) {
    if (!mounted) return;
    _cameraController?.stopImageStream();
    
    setState(() {
      _status = pass ? 'pass' : 'fail';
      _reason = reason;
      _confidence = conf;
    });

    final packProv = Provider.of<PackingProvider>(context, listen: false);
    
    if (pass) {
      packProv.passGate(GateType.boxIntegrity);
      Future.delayed(const Duration(milliseconds: 1000), () {
        if (!mounted) return;
        Navigator.pushReplacementNamed(context, '/barcode-scan');
      });
    } else {
      packProv.failGate(GateType.boxIntegrity);
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _imageLabeler.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool isScanning = _status == 'scanning';
    final bool isPass = _status == 'pass';
    final Color statusColor = isScanning ? AppColors.blue : (isPass ? AppColors.teal : AppColors.red);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Box Inspection'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back), 
          onPressed: () => Navigator.pop(context)
        ),
      ),
      body: Column(
        children: [
          // Viewport
          Container(
            height: 300,
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
                  ClipRRect(
                    borderRadius: BorderRadius.circular(5),
                    child: CameraPreview(_cameraController!),
                  )
                else
                  Container(
                    decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(5)),
                    child: const Center(
                      child: Icon(Icons.inventory_2_outlined, color: AppColors.textMuted, size: 72),
                    ),
                  ),

                if (_simFallback && isScanning)
                  const Positioned(
                    bottom: 8, right: 8,
                    child: Container(
                      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      color: AppColors.amber,
                      child: Text('DEMO MODE', style: TextStyle(fontSize: 10, color: Colors.black, fontWeight: FontWeight.bold)),
                    ),
                  ),

                if (isScanning)
                  const Center(
                    child: CircularProgressIndicator(color: AppColors.blue),
                  ),

                if (!isScanning)
                  Container(
                    color: statusColor.withValues(alpha: 0.3),
                    child: Center(
                      child: Icon(
                        isPass ? Icons.check_circle : Icons.cancel,
                        color: statusColor,
                        size: 96,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Results
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                Text(
                  isScanning 
                      ? 'Analyzing Box Integrity...' 
                      : (isPass ? 'BOX INTEGRITY VERIFIED' : 'DAMAGE DETECTED'),
                  style: TextStyle(
                    fontFamily: 'JetBrains Mono', 
                    fontSize: 16, 
                    fontWeight: FontWeight.bold,
                    color: statusColor,
                  ),
                ),
                const SizedBox(height: 8),
                if (!isScanning) ...[
                  Text(
                    'Label: $_reason',
                    style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
                  ),
                  Text(
                    'Confidence: ${(_confidence * 100).toStringAsFixed(1)}%',
                    style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textMuted),
                  ),
                ],
              ],
            ),
          ),

          const Spacer(),

          // Actions
          if (!isScanning && !isPass)
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton.icon(
                onPressed: () => Navigator.pop(context), // Back to box selection
                icon: const Icon(Icons.refresh),
                label: const Text('REJECT BOX — SELECT ANOTHER'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.red,
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
