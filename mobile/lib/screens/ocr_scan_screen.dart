import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../core/theme.dart';
import '../core/mock_data.dart';

/// Screen 03 — OCR / Barcode Scan
/// On physical device: uses mobile_scanner camera feed to scan QR/barcodes.
/// On iOS Simulator: falls back to a simulated scan (same UI, no camera).
class OcrScanScreen extends StatefulWidget {
  const OcrScanScreen({super.key});

  @override
  State<OcrScanScreen> createState() => _OcrScanScreenState();
}

class _OcrScanScreenState extends State<OcrScanScreen>
    with SingleTickerProviderStateMixin {
  // ── State ───────────────────────────────────────────────
  String _status = 'scanning'; // scanning | matched | failed
  String? _scannedSku;
  String? _matchedProduct;
  bool _matchPass = false;
  int _scannedCount = 0;
  final Set<int> _scannedItems = {};
  bool _simFallback = false;

  MobileScannerController? _scanCtrl;
  late AnimationController _lineAnim;
  late Animation<double> _linePos;

  // ── Init ────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _lineAnim = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
    _linePos = Tween<double>(begin: 0.1, end: 0.9).animate(CurvedAnimation(parent: _lineAnim, curve: Curves.easeInOut));

    // Real scanner only on physical device
    if (defaultTargetPlatform == TargetPlatform.iOS ||
        defaultTargetPlatform == TargetPlatform.android) {
      try {
        _scanCtrl = MobileScannerController(
          detectionSpeed: DetectionSpeed.normal,
          facing: CameraFacing.back,
        );
      } catch (_) {
        _simFallback = true;
      }
    } else {
      _simFallback = true;
    }

    if (_simFallback) _simulateScan();
  }

  @override
  void dispose() {
    _scanCtrl?.dispose();
    _lineAnim.dispose();
    super.dispose();
  }

  // ── Barcode detected (real device) ─────────────────────
  void _onBarcodeDetected(BarcodeCapture capture) {
    final barcodes = capture.barcodes;
    if (barcodes.isEmpty || _status != 'scanning') return;
    final raw = barcodes.first.rawValue ?? '';
    if (raw.isEmpty) return;
    _processScan(raw);
  }

  // ── Simulated scan (simulator) ──────────────────────────
  void _simulateScan() {
    setState(() { _status = 'scanning'; _scannedSku = null; _matchedProduct = null; });
    Future.delayed(const Duration(milliseconds: 1800), () {
      if (!mounted) return;
      final fakeSkus = ['SKU-9821-AA', 'SKU-9822-BB', 'SKU-9823-CC', 'SKU-9824-DD'];
      final idx = _scannedCount < fakeSkus.length ? _scannedCount : 0;
      _processScan(fakeSkus[idx]);
    });
  }

  void _processScan(String raw) {
    // Match against the current item in the order
    final totalItems = MockData.items.length;
    final itemIdx = _scannedCount < totalItems ? _scannedCount : totalItems - 1;
    final expectedItem = MockData.items[itemIdx];

    // A real SKU or barcode value → check against expected
    final pass = raw.contains(expectedItem.name) || raw.contains(expectedItem.sub);

    setState(() {
      _scannedSku = raw;
      _matchedProduct = expectedItem.name;
      _matchPass = pass;
      _status = pass ? 'matched' : 'failed';
      if (pass) {
        _scannedCount++;
        _scannedItems.add(expectedItem.id);
      }
    });

    // Pause scanner after detection so we don't flood with repeat reads
    _scanCtrl?.stop();
  }

  void _scanNext() {
    setState(() { _status = 'scanning'; _scannedSku = null; _matchedProduct = null; _matchPass = false; });
    if (_simFallback) {
      _simulateScan();
    } else {
      _scanCtrl?.start();
    }
  }

  // ── Build ───────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final totalItems = MockData.items.length;
    final allDone = _scannedCount >= totalItems;
    final isScanning = _status == 'scanning';
    final borderColor = isScanning ? AppColors.orange : (_matchPass ? AppColors.teal : AppColors.red);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        title: const Text('SCAN PRODUCT'),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
            decoration: BoxDecoration(
              color: allDone ? AppColors.teal.withValues(alpha: 0.15) : AppColors.amber.withValues(alpha: 0.12),
              border: Border.all(color: allDone ? AppColors.teal : AppColors.amber),
            ),
            child: Text(
              '$_scannedCount / $totalItems',
              style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 13, color: allDone ? AppColors.teal : AppColors.amber, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Camera / Viewfinder ───────────────────────
          Container(
            height: 240,
            decoration: BoxDecoration(border: Border.all(color: borderColor, width: 2)),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Real camera or dark fallback
                if (!_simFallback && _scanCtrl != null && isScanning)
                  MobileScanner(controller: _scanCtrl!, onDetect: _onBarcodeDetected)
                else
                  Container(color: Colors.black, child: const Center(child: Text('📦', style: TextStyle(fontSize: 72)))),

                // Scanning line
                if (isScanning)
                  AnimatedBuilder(
                    animation: _linePos,
                    builder: (ctx, _) => Positioned(
                      top: 240 * _linePos.value,
                      left: 24, right: 24,
                      child: Container(
                        height: 2,
                        decoration: BoxDecoration(
                          color: AppColors.orange,
                          boxShadow: [BoxShadow(color: AppColors.orange.withValues(alpha: 0.6), blurRadius: 8, spreadRadius: 2)],
                        ),
                      ),
                    ),
                  ),

                // Corner brackets
                ..._buildCorners(borderColor),

                // Sim badge
                if (_simFallback && isScanning)
                  Positioned(bottom: 8, right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(color: AppColors.amber.withValues(alpha: 0.9), borderRadius: BorderRadius.circular(4)),
                      child: const Text('DEMO MODE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.black)),
                    ),
                  ),

                // Result overlay
                if (!isScanning)
                  Positioned.fill(
                    child: Container(
                      color: (_matchPass ? AppColors.teal : AppColors.red).withValues(alpha: 0.15),
                      child: Center(
                        child: Icon(_matchPass ? Icons.check_circle : Icons.cancel,
                          size: 72, color: _matchPass ? AppColors.teal : AppColors.red),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // ── Status label ─────────────────────────────
          Container(
            width: double.infinity,
            color: borderColor.withValues(alpha: 0.08),
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text(
              isScanning
                  ? (_simFallback ? 'DEMO — SIMULATING BARCODE SCAN...' : 'POINT CAMERA AT BARCODE OR QR CODE')
                  : (_matchPass ? '✓ MATCH — ${_scannedSku ?? ''}' : '✗ MISMATCH — ${_scannedSku ?? ''}'),
              textAlign: TextAlign.center,
              style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: borderColor, fontWeight: FontWeight.w600),
            ),
          ),

          const SizedBox(height: 12),

          // ── Matched product card ──────────────────────
          if (_status != 'scanning' && _matchedProduct != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: (_matchPass ? AppColors.teal : AppColors.red).withValues(alpha: 0.08),
                  border: Border.all(color: _matchPass ? AppColors.teal : AppColors.red),
                ),
                child: Column(
                  children: [
                    _row('SKU SCANNED', _scannedSku ?? '—', _matchPass ? AppColors.teal : AppColors.red),
                    _row('PRODUCT', _matchedProduct!, _matchPass ? AppColors.teal : AppColors.red),
                    _row('RESULT', _matchPass ? '✓ PASS' : '✗ FAIL', _matchPass ? AppColors.teal : AppColors.red, bold: true),
                  ],
                ),
              ),
            ),

          const SizedBox(height: 12),

          // ── Order checklist ───────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Text('ORDER CHECKLIST', style: Theme.of(context).textTheme.labelSmall),
                const Spacer(),
                Text('${_scannedCount}/$totalItems scanned', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
              ],
            ),
          ),
          const SizedBox(height: 8),

          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: totalItems,
              itemBuilder: (ctx, i) {
                final item = MockData.items[i];
                final done = _scannedItems.contains(item.id);
                return Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.borderSubtle))),
                  child: Row(
                    children: [
                      Container(
                        width: 18, height: 18,
                        decoration: BoxDecoration(
                          color: done ? AppColors.teal : Colors.transparent,
                          border: Border.all(color: done ? AppColors.teal : AppColors.borderVisible),
                        ),
                        child: done ? const Icon(Icons.check, size: 12, color: Colors.black) : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: Text(item.name, style: TextStyle(color: done ? AppColors.textPrimary : AppColors.textSecondary, fontSize: 13))),
                      Text('×1', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
                    ],
                  ),
                );
              },
            ),
          ),

          // ── Bottom CTA ────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: allDone
                ? ElevatedButton.icon(
                    onPressed: () => Navigator.pushNamed(context, '/weight-check'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                    icon: const Icon(Icons.scale, size: 18),
                    label: const Text('ALL SCANNED — WEIGH BOX'),
                  )
                : (_status == 'scanning'
                    ? const SizedBox(
                        height: 48,
                        child: Center(child: Text('Scanning...', style: TextStyle(color: AppColors.textMuted))),
                      )
                    : ElevatedButton.icon(
                        onPressed: _scanNext,
                        icon: const Icon(Icons.qr_code_scanner, size: 18),
                        label: Text(_matchPass ? 'SCAN NEXT ITEM' : 'RETRY SCAN'),
                      )),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildCorners(Color color) => [
    Positioned(top: 8, left: 8, child: _corner(color, top: true, left: true)),
    Positioned(top: 8, right: 8, child: _corner(color, top: true, left: false)),
    Positioned(bottom: 8, left: 8, child: _corner(color, top: false, left: true)),
    Positioned(bottom: 8, right: 8, child: _corner(color, top: false, left: false)),
  ];

  Widget _corner(Color c, {required bool top, required bool left}) => SizedBox(
    width: 22, height: 22,
    child: DecoratedBox(decoration: BoxDecoration(
      border: Border(
        top: top ? BorderSide(color: c, width: 2.5) : BorderSide.none,
        bottom: !top ? BorderSide(color: c, width: 2.5) : BorderSide.none,
        left: left ? BorderSide(color: c, width: 2.5) : BorderSide.none,
        right: !left ? BorderSide(color: c, width: 2.5) : BorderSide.none,
      ),
    )),
  );

  Widget _row(String key, String val, Color c, {bool bold = false}) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(key, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
        Flexible(child: Text(val, textAlign: TextAlign.end, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: c, fontWeight: bold ? FontWeight.w700 : FontWeight.normal))),
      ],
    ),
  );
}
