import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../core/theme.dart';
import '../core/ml_helpers.dart';
import '../services/packing_provider.dart';
import '../widgets/packer_guide_widget.dart';
import '../widgets/flow_stepper_widget.dart';
import '../widgets/scan_guidance_overlay.dart';

class OcrScanScreen extends StatefulWidget {
  const OcrScanScreen({super.key});

  @override
  State<OcrScanScreen> createState() => _OcrScanScreenState();
}

class _OcrScanScreenState extends State<OcrScanScreen>
    with SingleTickerProviderStateMixin {
  // ── Scanner & ML ──────────────────────────────────────────────────────────
  late MobileScannerController _scannerController;
  late TextRecognizer _textRecognizer;

  // ── State flags ───────────────────────────────────────────────────────────
  // FIX 1: _isScannerStopped prevents calling stop()/start() on a
  // disposed or already-stopped controller, which was the root cause of
  // the repeated "BufferQueue has been abandoned" errors.
  bool _isScannerStopped = false;

  // FIX 2: Use a separate _isProcessing flag AND reset it via whenComplete()
  // so it always resets even on exceptions — was previously getting stuck.
  bool _isProcessing = false;

  bool _isDisposed = false;
  String _status = 'scanning'; // scanning | ocr_fallback | verifying | pass | fail
  String _scannedData = '';
  String _failReason = '';
  bool _simFallback = false;
  DateTime? _lastOcrFrameAt;
  bool _isFlashOn = false;
  double _currentZoom = 0.0;

  // FIX 3: Use Timer (cancellable) instead of Future.delayed (not cancellable).
  // Non-cancellable delays were firing after dispose(), triggering
  // "setState called after dispose" crashes.
  Timer? _ocrFallbackTimer;
  Timer? _navigationTimer;
  Timer? _simTimer;

  // ── Animation ─────────────────────────────────────────────────────────────
  late AnimationController _lineAnim;
  late Animation<double> _linePos;

  static const _tips = [
    '📷 Point camera directly at the barcode',
    '💡 Ensure barcode is well-lit — no shadows',
    '↔️ Try rotating the item 90°',
    '🔍 Move closer until barcode fills the box',
    '⏳ No barcode? OCR text mode activates at 5s',
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();

    // FIX 4: Create controller in initState so it's properly tied to lifecycle,
    // not as a field initialiser that runs before the widget tree exists.
    _scannerController = MobileScannerController(
      formats: const [
        BarcodeFormat.qrCode,
        BarcodeFormat.ean13,
        BarcodeFormat.code128,
      ],
      // returnImage only needed for OCR fallback — we toggle it dynamically
      // by stopping/restarting with a new controller if needed, but for
      // simplicity we keep it true and guard OCR processing by _status.
      returnImage: true,
    );

    _textRecognizer = TextRecognizer();

    _lineAnim = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _linePos = Tween<double>(begin: 0.1, end: 0.9).animate(
      CurvedAnimation(parent: _lineAnim, curve: Curves.easeInOut),
    );

    // FIX 5: Use addPostFrameCallback instead of Future.delayed(500ms).
    // The widget tree is guaranteed to be built here; a magic delay is fragile.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_isDisposed) _initScanner();
    });
  }

  void _initScanner() {
    final packProv = Provider.of<PackingProvider>(context, listen: false);

    if (!MLHelpers.isPhysicalDevice() || packProv.isAutoProcessing) {
      _enableSimFallback(forcePass: packProv.isAutoProcessing);
      return;
    }

    // Start the 5-second OCR-fallback countdown.
    // FIX 6: Stored in a field so it can be cancelled in dispose() and retry().
    _ocrFallbackTimer = Timer(const Duration(seconds: 5), () {
      if (!_isDisposed && mounted && _status == 'scanning') {
        setState(() => _status = 'ocr_fallback');
      }
    });
  }

  void _enableSimFallback({bool forcePass = false}) {
    if (!mounted || _isDisposed) return;
    setState(() => _simFallback = true);

    _simTimer?.cancel();
    _simTimer = Timer(const Duration(milliseconds: 1500), () async {
      if (!mounted || _isDisposed) return;
      final packProv = Provider.of<PackingProvider>(context, listen: false);
      final sku = packProv.currentItem?.productSku ?? 'UNKNOWN';
      await _verifyWithBackend(sku, isSimulated: forcePass);
    });
  }

  @override
  void dispose() {
    _isDisposed = true;

    // FIX 7: Cancel ALL timers before releasing resources.
    // This is the primary fix for "setState called after dispose".
    _ocrFallbackTimer?.cancel();
    _navigationTimer?.cancel();
    _simTimer?.cancel();

    // FIX 8: Set the stopped flag BEFORE calling dispose() so that any
    // in-flight _onDetect callbacks bail out immediately rather than
    // trying to interact with an already-disposed controller.
    _isScannerStopped = true;
    _scannerController.dispose();

    _textRecognizer.close();
    _lineAnim.dispose();
    super.dispose();
  }

  // ── Scanning ──────────────────────────────────────────────────────────────

  void _onDetect(BarcodeCapture capture) {
    // FIX 9: Guard with _isScannerStopped AND _isDisposed before ANY
    // processing. This prevents the "BufferQueue has been abandoned" errors —
    // the camera hardware keeps delivering frames for a few milliseconds after
    // stop() is called, and processing them was crashing the native buffer.
    if (_isScannerStopped || _isDisposed || _isProcessing) return;
    if (_status != 'scanning' && _status != 'ocr_fallback') return;

    // Throttle OCR frames (barcodes don't need throttling).
    if (capture.barcodes.isEmpty) {
      final now = DateTime.now();
      if (_lastOcrFrameAt != null &&
          now.difference(_lastOcrFrameAt!).inMilliseconds < 400) {
        return;
      }
      _lastOcrFrameAt = now;
    }

    _isProcessing = true;

    // FIX 10: Use whenComplete() to ALWAYS reset _isProcessing, even if an
    // exception is thrown inside _processCapture. Previously, any exception
    // would leave _isProcessing = true forever, permanently locking the
    // scanner in a "skip every frame" state.
    _processCapture(capture).whenComplete(() {
      _isProcessing = false;
    });
  }

  Future<void> _processCapture(BarcodeCapture capture) async {
    try {
      if (_status == 'scanning' && capture.barcodes.isNotEmpty) {
        final raw = capture.barcodes.first.rawValue;
        if (raw != null && raw.isNotEmpty) {
          // FIX 11: Stop scanner via our wrapper BEFORE the async verify call.
          // This ensures _isScannerStopped is true so any frames that arrive
          // in the brief window before the native stop completes are dropped.
          _stopScanner();
          await _verifyWithBackend(raw);
        }
      } else if (_status == 'ocr_fallback' && capture.image != null) {
        final inputImage =
            await MLHelpers.inputImageFromMobileScanner(capture.image!);
        if (inputImage == null) return;

        final recognizedText = await _textRecognizer.processImage(inputImage);
        final text = recognizedText.text.trim();
        debugPrint('OCR OUTPUT:\n$text\n---');

        // FIX 12: Check mounted/disposed after every await — the widget may
        // have been popped while OCR was running.
        if (!mounted || _isDisposed) return;

        if (text.isNotEmpty) {
          _stopScanner();
          await _verifyWithBackend(text);
        }
      }
    } catch (e) {
      // whenComplete() above will reset _isProcessing; just log here.
      debugPrint('Scan processing error: $e');
    }
  }

  /// Stops the scanner exactly once and sets the guard flag.
  void _stopScanner() {
    if (!_isScannerStopped) {
      _isScannerStopped = true;
      _scannerController.stop();
    }
  }

  /// Starts the scanner and clears the guard flag.
  void _startScanner() {
    if (_isScannerStopped && !_isDisposed) {
      _isScannerStopped = false;
      _scannerController.start();
    }
  }

  // ── Verification ──────────────────────────────────────────────────────────

  Future<void> _verifyWithBackend(
    String rawData, {
    bool isSimulated = false,
  }) async {
    if (!mounted || _isDisposed) return;

    setState(() {
      _status = 'verifying';
      _scannedData = rawData;
    });

    final packProv = Provider.of<PackingProvider>(context, listen: false);

    if (isSimulated) {
      await Future.delayed(const Duration(milliseconds: 500));
      if (!mounted || _isDisposed) return;
      _handleResult(true, 'Match!');
      return;
    }

    try {
      final result = await packProv.verifyItemBackend(rawData);
      if (!mounted || _isDisposed) return;

      if (result['result'] == 'PASS') {
        _handleResult(true, 'Match!', result: result);
      } else {
        final message =
            result['error'] as String? ?? _buildMismatchMessage(result);
        _handleResult(false, message);
      }
    } catch (e) {
      if (!mounted || _isDisposed) return;
      _handleResult(false, 'Network error — check connection');
    }
  }

  /// Converts the backend's boolean mismatch fields into a readable string.
  String _buildMismatchMessage(Map<String, dynamic> result) {
    final parts = <String>[];
    if (result['skuMatch'] == false) parts.add('SKU mismatch');
    if (result['brandMatch'] == false) parts.add('Brand mismatch');
    if (result['colorMatch'] == false) parts.add('Color mismatch');
    final weightResult = result['weightResult'];
    if (weightResult != null &&
        weightResult != 'PASS' &&
        weightResult != 'SKIP') {
      parts.add('Weight $weightResult');
    }
    return parts.isEmpty ? 'Identity mismatch' : parts.join(' · ');
  }

  void _handleResult(bool pass, String message, {Map<String, dynamic>? result}) {
    if (!mounted || _isDisposed) return;
    setState(() {
      _status = pass ? 'pass' : 'fail';
      _failReason = message;
    });

    final packProv = Provider.of<PackingProvider>(context, listen: false);

    if (pass) {
      HapticFeedback.mediumImpact();
      packProv.passGate(GateType.identity);
      
      final bool colorMatch = result != null && result['colorMatch'] == true;
      if (colorMatch) {
         packProv.passGate(GateType.color);
      }

      _navigationTimer = Timer(const Duration(milliseconds: 800), () {
        if (!mounted || _isDisposed) return;
        Navigator.pushReplacementNamed(context, colorMatch ? '/size-estimate' : '/color-verify');
      });
    } else {
      HapticFeedback.heavyImpact();
      packProv.failGate(GateType.identity);
    }
  }

  // ── User actions ──────────────────────────────────────────────────────────

  void _retry() {
    // FIX 15: Cancel the OCR fallback timer so it doesn't fire mid-retry.
    _ocrFallbackTimer?.cancel();
    _navigationTimer?.cancel();

    setState(() {
      _status = 'scanning';
      _scannedData = '';
      _failReason = '';
      // FIX 16: Explicitly reset _isProcessing on retry. If a crash left
      // it true, the scanner would silently drop every frame after retry.
      _isProcessing = false;
    });

    if (!_simFallback) {
      _startScanner();
      // Restart the 5-second OCR fallback countdown.
      _ocrFallbackTimer = Timer(const Duration(seconds: 5), () {
        if (!_isDisposed && mounted && _status == 'scanning') {
          setState(() => _status = 'ocr_fallback');
        }
      });
    } else {
      _enableSimFallback();
    }
  }

  // FIX 17: toggleTorch() is async — await it and only update UI after it
  // resolves so the icon doesn't flip if the call fails.
  Future<void> _toggleFlash() async {
    await _scannerController.toggleTorch();
    if (mounted && !_isDisposed) {
      setState(() => _isFlashOn = !_isFlashOn);
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final packProv = Provider.of<PackingProvider>(context);
    final item = packProv.currentItem;

    final bool isScanning =
        _status == 'scanning' || _status == 'ocr_fallback';
    final bool isPass = _status == 'pass';
    final Color statusColor = isScanning
        ? AppColors.orange
        : (isPass ? AppColors.teal : AppColors.red);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Verification'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          const FlowStepperWidget(currentStep: 1),
          PackerGuideWidget(
            stepNumber: 2,
            totalSteps: 5,
            stepTitle: '🔍 Identity Scan',
            instruction:
                'Aim the camera at the product BARCODE or QR code.',
            expectedInfo: item != null
                ? 'Looking for: ${item.productName}\nSKU: ${item.productSku}'
                : 'Loading...',
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
                  // ── Camera / sim placeholder ──────────────────────────
                  if (!_simFallback)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(5),
                      child: MobileScanner(
                        controller: _scannerController,
                        onDetect: _onDetect,
                        errorBuilder: (context, error, child) {
                          return Container(
                            decoration: BoxDecoration(
                              color: Colors.black,
                              borderRadius: BorderRadius.circular(5),
                            ),
                            child: Center(
                              child: Text(
                                error.errorCode.name,
                                style: const TextStyle(
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    )
                  else
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.qr_code_scanner,
                          color: AppColors.textMuted,
                          size: 72,
                        ),
                      ),
                    ),

                  // ── Scanning line animation ────────────────────────────
                  if (isScanning)
                    AnimatedBuilder(
                      animation: _linePos,
                      builder: (ctx, _) => Positioned(
                        top: 280 * _linePos.value,
                        left: 16,
                        right: 16,
                        child: Container(
                          height: 2,
                          decoration: BoxDecoration(
                            color: AppColors.orange,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.orange.withValues(alpha: 0.6),
                                blurRadius: 8,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                  // ── Zoom slider ───────────────────────────────────────
                  if (!_simFallback && isScanning)
                    Positioned(
                      bottom: 16,
                      left: 32,
                      right: 32,
                      child: Row(
                        children: [
                          const Icon(Icons.zoom_out,
                              color: Colors.white, size: 20),
                          Expanded(
                            child: Slider(
                              value: _currentZoom,
                              min: 0.0,
                              max: 1.0,
                              activeColor: AppColors.orange,
                              onChanged: (val) {
                                setState(() => _currentZoom = val);
                                _scannerController.setZoomScale(val);
                              },
                            ),
                          ),
                          const Icon(Icons.zoom_in,
                              color: Colors.white, size: 20),
                        ],
                      ),
                    ),

                  // ── Flash toggle ──────────────────────────────────────
                  if (isScanning && !_simFallback)
                    Positioned(
                      top: 16,
                      right: 16,
                      child: IconButton(
                        icon: Icon(
                          _isFlashOn ? Icons.flash_on : Icons.flash_off,
                        ),
                        color: Colors.white,
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.black54,
                        ),
                        // FIX 17 (UI side): onPressed is now async-safe.
                        onPressed: _toggleFlash,
                      ),
                    ),

                  // ── OCR fallback banner ───────────────────────────────
                  if (_status == 'ocr_fallback')
                    Positioned(
                      top: 8,
                      left: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        color: AppColors.amber,
                        child: const Text(
                          'No Barcode — Reading text label via OCR...',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),

                  // ── Pass / fail overlay ───────────────────────────────
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

                  // ── Verifying spinner ─────────────────────────────────
                  if (_status == 'verifying')
                    Container(
                      color: Colors.black54,
                      child: const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircularProgressIndicator(color: AppColors.orange),
                            SizedBox(height: 16),
                            Text(
                              'VERIFYING...',
                              style: TextStyle(
                                color: AppColors.orange,
                                fontFamily: 'JetBrains Mono',
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                  // ── Guidance overlay ──────────────────────────────────
                  ScanGuidanceOverlay(
                    isScanning: isScanning,
                    tips: _tips,
                    accentColor: AppColors.orange,
                  ),
                ],
              ),
            ),
          ),

          // ── Retry button ────────────────────────────────────────────────
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
