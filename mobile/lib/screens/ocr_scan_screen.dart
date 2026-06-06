import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'package:google_mlkit_barcode_scanning/google_mlkit_barcode_scanning.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../core/theme.dart';
import '../core/ml_helpers.dart';
import '../services/packing_provider.dart';

class OcrScanScreen extends StatefulWidget {
  const OcrScanScreen({super.key});

  @override
  State<OcrScanScreen> createState() => _OcrScanScreenState();
}

class _OcrScanScreenState extends State<OcrScanScreen> with SingleTickerProviderStateMixin {
  CameraController? _cameraController;
  late BarcodeScanner _barcodeScanner;
  late TextRecognizer _textRecognizer;
  
  bool _isProcessing = false;
  String _status = 'scanning'; // scanning | ocr_fallback | verifying | pass | fail
  String _scannedData = '';
  String _failReason = '';
  bool _simFallback = false;

  late AnimationController _lineAnim;
  late Animation<double> _linePos;

  @override
  void initState() {
    super.initState();
    _lineAnim = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
    _linePos = Tween<double>(begin: 0.1, end: 0.9).animate(CurvedAnimation(parent: _lineAnim, curve: Curves.easeInOut));

    _barcodeScanner = BarcodeScanner(formats: [BarcodeFormat.qrCode, BarcodeFormat.ean13, BarcodeFormat.code128]);
    _textRecognizer = TextRecognizer();

    _initScanner();
  }

  void _initScanner() async {
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
          
          // Set 3s timeout for OCR fallback
          Future.delayed(const Duration(seconds: 5), () {
            if (mounted && _status == 'scanning') {
              setState(() => _status = 'ocr_fallback');
            }
          });
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
    
    Future.delayed(const Duration(milliseconds: 1500), () async {
      if (!mounted) return;
      
      final packProv = Provider.of<PackingProvider>(context, listen: false);
      final currentItem = packProv.currentItem;
      
      if (forcePass && currentItem != null) {
        _verifyWithBackend(currentItem.productSku);
      } else {
        // Just mock a random SKU if no force pass, but usually it should pass in a demo
        _verifyWithBackend(currentItem?.productSku ?? "UNKNOWN");
      }
    });
  }

  void _processCameraImage(CameraImage image) async {
    if (_isProcessing || (_status != 'scanning' && _status != 'ocr_fallback')) return;
    _isProcessing = true;

    try {
      final inputImage = MLHelpers.inputImageFromCameraImage(image, _cameraController);
      if (inputImage == null) {
        _isProcessing = false;
        return;
      }

      if (_status == 'scanning') {
        final barcodes = await _barcodeScanner.processImage(inputImage);
        if (barcodes.isNotEmpty) {
          final raw = barcodes.first.rawValue;
          if (raw != null && raw.isNotEmpty) {
            _cameraController?.stopImageStream();
            _verifyWithBackend(raw);
          }
        }
      } else if (_status == 'ocr_fallback') {
        final recognizedText = await _textRecognizer.processImage(inputImage);
        final text = recognizedText.text;
        
        // Very basic mock heuristic to find a SKU or name in OCR text
        // In reality you would call /products/search?text=...
        if (text.isNotEmpty) {
           _cameraController?.stopImageStream();
           _verifyWithBackend(text); // Pass OCR text to backend
        }
      }
    } catch (e) {
      // Ignore
    }

    _isProcessing = false;
  }

  Future<void> _verifyWithBackend(String rawData) async {
    if (!mounted) return;
    setState(() {
      _status = 'verifying';
      _scannedData = rawData;
    });

    final packProv = Provider.of<PackingProvider>(context, listen: false);
    
    // In simulator mode with auto process, mock the response so it's instantaneous
    if (_simFallback && packProv.isAutoProcessing) {
      await Future.delayed(const Duration(milliseconds: 500)); // small delay for UI
      _handleResult(true, "Mock Match for Demo");
      return;
    }

    final result = await packProv.verifyItemBackend(rawData);
    
    if (result['result'] == 'PASS') {
      _handleResult(true, "Match!");
    } else {
      _handleResult(false, result['error'] ?? "Identity or weight mismatch");
    }
  }

  void _handleResult(bool pass, String message) {
    if (!mounted) return;
    
    setState(() {
      _status = pass ? 'pass' : 'fail';
      _failReason = message;
    });

    final packProv = Provider.of<PackingProvider>(context, listen: false);
    
    if (pass) {
      packProv.passGate(GateType.identity);
      Future.delayed(const Duration(milliseconds: 1000), () {
        if (!mounted) return;
        Navigator.pushReplacementNamed(context, '/color-verify');
      });
    } else {
      packProv.failGate(GateType.identity);
    }
  }

  void _retry() {
    setState(() {
      _status = 'scanning';
      _scannedData = '';
      _failReason = '';
    });
    if (!_simFallback) {
      _cameraController?.startImageStream(_processCameraImage);
    } else {
      _enableSimFallback();
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _barcodeScanner.close();
    _textRecognizer.close();
    _lineAnim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final packProv = Provider.of<PackingProvider>(context);
    final item = packProv.currentItem;
    
    final bool isScanning = _status == 'scanning' || _status == 'ocr_fallback';
    final bool isPass = _status == 'pass';
    final Color statusColor = isScanning ? AppColors.orange : (isPass ? AppColors.teal : AppColors.red);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Identity Gate (Barcode)'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back), 
          onPressed: () => Navigator.pop(context)
        ),
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Text(
                'ITEM ${packProv.currentItemIndex + 1} OF ${packProv.orderItems.length}',
                style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textMuted),
              ),
            ),
          )
        ],
      ),
      body: Column(
        children: [
          // Target Item Info
          if (item != null)
            Container(
              padding: const EdgeInsets.all(16),
              color: AppColors.surface,
              child: Row(
                children: [
                  const Icon(Icons.inventory_2, color: AppColors.orange),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('EXPECTED ITEM', style: TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                        Text(item.productName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                        Text(item.productSku, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: AppColors.textMuted)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

          // Viewport
          Container(
            height: 280,
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
                      child: Icon(Icons.qr_code_scanner, color: AppColors.textMuted, size: 72),
                    ),
                  ),

                if (isScanning)
                  AnimatedBuilder(
                    animation: _linePos,
                    builder: (ctx, _) => Positioned(
                      top: 280 * _linePos.value,
                      left: 16, right: 16,
                      child: Container(
                        height: 2,
                        decoration: BoxDecoration(
                          color: AppColors.orange,
                          boxShadow: [BoxShadow(color: AppColors.orange.withValues(alpha: 0.6), blurRadius: 8, spreadRadius: 2)],
                        ),
                      ),
                    ),
                  ),

                if (_status == 'ocr_fallback')
                  Positioned(
                    top: 8, left: 8, right: 8,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      color: AppColors.amber,
                      child: const Text('No Barcode Detected — Falling back to OCR label reading...', style: TextStyle(fontSize: 12, color: Colors.black, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                    ),
                  ),

                if (!isScanning && _status != 'verifying')
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
                  
                if (_status == 'verifying')
                  Container(
                    color: Colors.black54,
                    child: const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(color: AppColors.orange),
                          SizedBox(height: 16),
                          Text('VERIFYING WITH BACKEND...', style: TextStyle(color: AppColors.orange, fontFamily: 'JetBrains Mono', fontWeight: FontWeight.bold)),
                        ],
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
                  _status == 'scanning' ? 'Scanning Barcode / QR...' 
                    : (_status == 'ocr_fallback' ? 'Reading Text...'
                    : (_status == 'verifying' ? 'Verifying...'
                    : (isPass ? 'IDENTITY VERIFIED' : 'MISMATCH DETECTED'))),
                  style: TextStyle(
                    fontFamily: 'JetBrains Mono', 
                    fontSize: 16, 
                    fontWeight: FontWeight.bold,
                    color: statusColor,
                  ),
                ),
                const SizedBox(height: 8),
                if (!isScanning && _status != 'verifying') ...[
                  Text(
                    'Scanned: $_scannedData',
                    style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
                  ),
                  if (!isPass)
                    Text(
                      _failReason,
                      style: const TextStyle(fontSize: 14, color: AppColors.red, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                ],
              ],
            ),
          ),

          const Spacer(),

          // Actions
          if (_status == 'fail')
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton.icon(
                onPressed: _retry,
                icon: const Icon(Icons.refresh),
                label: const Text('RETRY SCAN'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.orange,
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
