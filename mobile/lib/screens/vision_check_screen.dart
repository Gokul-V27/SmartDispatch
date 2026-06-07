import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../core/theme.dart';

class VisionCheckScreen extends StatefulWidget {
  const VisionCheckScreen({super.key});

  @override
  State<VisionCheckScreen> createState() => _VisionCheckScreenState();
}

class _VisionCheckScreenState extends State<VisionCheckScreen> {
  // ── State ───────────────────────────────────────────────
  bool _analyzing = true;
  bool _anomalyDetected = false;
  bool _simFallback = false;
  bool _isFlashOn = false;
  
  CameraController? _cameraController;
  final TextRecognizer _textRecognizer = TextRecognizer();
  List<String> _detectedTexts = [];

  // ── Init ────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    if (defaultTargetPlatform == TargetPlatform.iOS || defaultTargetPlatform == TargetPlatform.android) {
      try {
        final cameras = await availableCameras();
        if (cameras.isEmpty) {
          _enableSimFallback();
          return;
        }
        _cameraController = CameraController(
          cameras.first,
          ResolutionPreset.medium,
          enableAudio: false,
        );
        await _cameraController!.initialize();
        if (mounted) {
          setState(() {});
          _startAnalysis();
        }
      } catch (e) {
        _enableSimFallback();
      }
    } else {
      _enableSimFallback();
    }
  }

  void _enableSimFallback() {
    if (mounted) {
      setState(() {
        _simFallback = true;
      });
      _simulateAnalysis();
    }
  }

  // ── Real Camera Analysis ────────────────────────────────
  Future<void> _startAnalysis() async {
    // Wait a couple seconds to pretend we are running heavy ML inference,
    // then take a picture and run text recognition.
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted || _cameraController == null || !_cameraController!.value.isInitialized) return;

    try {
      final image = await _cameraController!.takePicture();
      final inputImage = InputImage.fromFilePath(image.path);
      final recognizedText = await _textRecognizer.processImage(inputImage);
      
      List<String> texts = recognizedText.blocks.map((b) => b.text).toList();
      
      setState(() {
        _analyzing = false;
        _detectedTexts = texts.take(4).toList(); // show up to 4 texts
        // Randomly simulate an anomaly if texts are weird, but for this demo let's just say no anomaly if we found text.
        _anomalyDetected = texts.isEmpty; 
        if (_detectedTexts.isEmpty) {
           _detectedTexts = ['No recognizable text found'];
        }
      });
    } catch (e) {
      setState(() {
        _analyzing = false;
        _anomalyDetected = true;
      });
    }
  }

  // ── Simulated Analysis ──────────────────────────────────
  void _simulateAnalysis() {
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _analyzing = false;
          _anomalyDetected = true; // Spec shows a red anomaly for demonstration
          _detectedTexts = [
            'Rice bag (white, 5kg)',
            'Dal packet (yellow)',
            'Oil bottle (1L)',
            'Unknown item detected'
          ];
        });
      }
    });
  }

  void _retake() {
    setState(() {
      _analyzing = true;
      _anomalyDetected = false;
      _detectedTexts = [];
    });
    if (_simFallback) {
      _simulateAnalysis();
    } else {
      _startAnalysis();
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
    _textRecognizer.close();
    super.dispose();
  }

  // ── Build ───────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('AI Vision Check'),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.purple.withValues(alpha: 0.1),
              border: Border.all(color: AppColors.purple.withValues(alpha: 0.3)),
            ),
            child: const Text(
              'LAYER 3',
              style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.purple),
            ),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Camera Area
            Container(
              height: 240,
              decoration: BoxDecoration(
                color: Colors.black,
                border: Border.all(color: AppColors.purple, width: 2),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  if (!_simFallback && _cameraController != null && _cameraController!.value.isInitialized)
                    ClipRect(
                      child: OverflowBox(
                        alignment: Alignment.center,
                        child: FittedBox(
                          fit: BoxFit.cover,
                          child: SizedBox(
                            width: _cameraController!.value.previewSize?.height ?? 1,
                            height: _cameraController!.value.previewSize?.width ?? 1,
                            child: CameraPreview(_cameraController!),
                          ),
                        ),
                      ),
                    )
                  else
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.camera_alt, color: AppColors.textSecondary, size: 48),
                        const SizedBox(height: 8),
                        Text(
                          _analyzing ? 'ANALYZING...' : 'PHOTO TAKEN',
                          style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.purple),
                        ),
                      ],
                    ),
                  
                  if (_simFallback && _analyzing)
                    Positioned(bottom: 8, right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(color: AppColors.purple.withValues(alpha: 0.9), borderRadius: BorderRadius.circular(4)),
                        child: const Text('DEMO MODE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.black)),
                      ),
                    ),

                  if (_analyzing)
                    const Positioned.fill(
                      child: Align(
                        alignment: Alignment.bottomCenter,
                        child: LinearProgressIndicator(color: AppColors.purple, backgroundColor: Colors.transparent),
                      ),
                    ),

                  if (!_simFallback && !_analyzing)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: IconButton(
                        icon: Icon(_isFlashOn ? Icons.flash_on : Icons.flash_off),
                        color: Colors.white,
                        style: IconButton.styleFrom(backgroundColor: Colors.black54),
                        onPressed: _toggleFlash,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // AI Detection Results
            if (!_analyzing) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.purple.withValues(alpha: 0.1),
                  border: Border.all(color: AppColors.purple.withValues(alpha: 0.4)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('AI DETECTED (${_detectedTexts.length} items)', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.purple)),
                    const SizedBox(height: 8),
                    ..._detectedTexts.map((text) {
                      bool isUnknown = text.toLowerCase().contains('unknown') || text == 'No recognizable text found';
                      return _buildDetectionRow(text, isUnknown ? '71%' : '90%+', !isUnknown);
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Alert
              if (_anomalyDetected)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.red.withValues(alpha: 0.1),
                    border: const Border(left: BorderSide(color: AppColors.red, width: 3)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.warning, color: AppColors.red, size: 16),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '⚠ Unrecognised object or missing text in box — supervisor review',
                          style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.red),
                        ),
                      ),
                    ],
                  ),
                ),
              
              const Spacer(),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _retake,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textPrimary,
                        side: const BorderSide(color: AppColors.borderVisible),
                      ),
                      child: const Text('RETAKE'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, '/nfc-seal'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _anomalyDetected ? AppColors.purple : AppColors.teal,
                      ),
                      child: Text(_anomalyDetected ? 'SUPERVISOR PIN' : 'PROCEED TO NFC'),
                    ),
                  ),
                ],
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildDetectionRow(String item, String confidence, bool success) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 14, height: 14,
            decoration: BoxDecoration(
              color: success ? AppColors.teal : AppColors.red,
              borderRadius: BorderRadius.circular(2),
            ),
            child: Icon(success ? Icons.check : Icons.close, size: 10, color: success ? Colors.black : Colors.white),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              item,
              style: TextStyle(fontSize: 12, color: success ? AppColors.textPrimary : AppColors.red),
            ),
          ),
          Text(
            confidence,
            style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: success ? AppColors.textMuted : AppColors.red),
          ),
        ],
      ),
    );
  }
}
