import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

/// Screen 03 — Barcode/QR Scan + Auto-Verify
/// Worker scans product barcode/QR → backend auto-fetches product details,
/// compares brand, SKU, color, weight → shows GREEN (pass) or RED (fail)
/// NO manual input needed. Weight is checked automatically from the DB.
class OcrScanScreen extends StatefulWidget {
  const OcrScanScreen({super.key});
  @override
  State<OcrScanScreen> createState() => _OcrScanScreenState();
}

class _OcrScanScreenState extends State<OcrScanScreen> {
  Map<String, dynamic>? _order;
  List<dynamic> _items = [];
  int _currentItemIndex = 0;
  String _scanStatus = 'ready'; // ready, scanning, pass, fail
  Map<String, dynamic>? _verifyResult;

  // For demo/testing when no camera — simulates barcode scan
  final _skuInputCtrl = TextEditingController();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map<String, dynamic> && _order == null) {
      _order = args;
      _items = List.from(args['items'] ?? []);
    }
  }

  /// Called when barcode scanner detects a code, or user submits SKU manually
  Future<void> _onBarcodeScanned(String scannedSku) async {
    if (_items.isEmpty || scannedSku.isEmpty) return;
    setState(() { _scanStatus = 'scanning'; _verifyResult = null; });

    // Haptic feedback on scan
    HapticFeedback.mediumImpact();

    final api = context.read<ApiService>();
    final auth = context.read<AuthService>();
    final item = _items[_currentItemIndex];

    // ONE API call does everything: OCR match + weight check
    final result = await api.scanVerify(
      orderItemId: item['id'],
      workerId: auth.userId ?? '',
      scannedSku: scannedSku.trim(),
    );

    if (result != null) {
      final pass = result['result'] == 'PASS';
      setState(() {
        _scanStatus = pass ? 'pass' : 'fail';
        _verifyResult = result;
      });

      // Vibration pattern based on result
      if (pass) {
        HapticFeedback.heavyImpact();
      } else {
        HapticFeedback.vibrate();
      }
    }
  }

  void _nextItem() {
    if (_currentItemIndex < _items.length - 1) {
      setState(() {
        _currentItemIndex++;
        _scanStatus = 'ready';
        _verifyResult = null;
        _skuInputCtrl.clear();
      });
    } else {
      // All items verified → skip weight screen (already done) → go to pack complete
      Navigator.pushReplacementNamed(context, '/pack-complete', arguments: _order);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentItem = _items.isNotEmpty ? _items[_currentItemIndex] : null;
    final borderColor = _scanStatus == 'pass' ? AppColors.teal
        : _scanStatus == 'fail' ? AppColors.red : AppColors.teal;
    final bgTint = _scanStatus == 'pass' ? AppColors.teal.withValues(alpha: 0.03)
        : _scanStatus == 'fail' ? AppColors.red.withValues(alpha: 0.03) : Colors.transparent;

    return Scaffold(
      backgroundColor: bgTint == Colors.transparent ? AppColors.bg : bgTint,
      appBar: AppBar(
        title: const Text('SCAN PRODUCT'),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(border: Border.all(color: AppColors.teal), color: AppColors.teal.withValues(alpha: 0.1)),
            child: Text('${_currentItemIndex + 1}/${_items.length}',
              style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: AppColors.teal)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Column(children: [
          // ── Camera / Scanner viewfinder ──────────────────────
          Container(
            height: 220,
            width: double.infinity,
            decoration: BoxDecoration(
              border: Border.all(color: borderColor, width: 2),
              color: AppColors.surface,
            ),
            child: Stack(children: [
              // Corner brackets
              Positioned(top: 8, left: 8, child: _CornerBracket(color: borderColor, rotation: 0)),
              Positioned(top: 8, right: 8, child: _CornerBracket(color: borderColor, rotation: 1)),
              Positioned(bottom: 8, left: 8, child: _CornerBracket(color: borderColor, rotation: 3)),
              Positioned(bottom: 8, right: 8, child: _CornerBracket(color: borderColor, rotation: 2)),

              // Center content
              Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(
                  _scanStatus == 'pass' ? Icons.check_circle_outline
                    : _scanStatus == 'fail' ? Icons.error_outline
                    : Icons.qr_code_scanner,
                  size: 56, color: borderColor,
                ),
                const SizedBox(height: 8),
                Text(
                  _scanStatus == 'scanning' ? 'VERIFYING...'
                    : _scanStatus == 'pass' ? 'VERIFIED ✓'
                    : _scanStatus == 'fail' ? 'MISMATCH ✗'
                    : 'SCAN BARCODE / QR CODE',
                  style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: borderColor, letterSpacing: 1, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text('Point camera at product barcode or QR code',
                  style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
              ])),
            ]),
          ),
          const SizedBox(height: 8),

          // ── SKU input for testing (replaces camera when no device) ──
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderSubtle)),
            child: Row(children: [
              Expanded(child: TextField(
                controller: _skuInputCtrl,
                style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'Enter / scan SKU code',
                  labelText: 'SCANNED CODE',
                  isDense: true,
                  contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                ),
              )),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _scanStatus == 'scanning' ? null : () => _onBarcodeScanned(_skuInputCtrl.text),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(80, 42),
                  backgroundColor: AppColors.teal,
                ),
                child: Text(_scanStatus == 'scanning' ? '...' : 'SCAN'),
              ),
            ]),
          ),
          const SizedBox(height: 12),

          // ── Expected product info ───────────────────────────
          if (currentItem != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: const Border(left: BorderSide(color: AppColors.blue, width: 3)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('EXPECTED PRODUCT', style: Theme.of(context).textTheme.labelSmall),
                const SizedBox(height: 6),
                Text(currentItem['productName'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(height: 4),
                _DetailRow('BRAND', currentItem['productBrand'] ?? ''),
                _DetailRow('SKU', currentItem['productSku'] ?? '', color: AppColors.blue),
                _DetailRow('COLOR', currentItem['productColor'] ?? ''),
                _DetailRow('QTY', '×${currentItem['quantity'] ?? 1}'),
              ]),
            ),
          const SizedBox(height: 12),

          // ── VERIFICATION RESULT ─────────────────────────────
          if (_verifyResult != null) ...[
            // Overall result banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: (_scanStatus == 'pass' ? AppColors.teal : AppColors.red).withValues(alpha: 0.1),
                border: Border.all(color: _scanStatus == 'pass' ? AppColors.teal : AppColors.red, width: 2),
              ),
              child: Column(children: [
                Icon(_scanStatus == 'pass' ? Icons.check_circle : Icons.cancel,
                  size: 40, color: _scanStatus == 'pass' ? AppColors.teal : AppColors.red),
                const SizedBox(height: 8),
                Text(_scanStatus == 'pass' ? 'ALL CHECKS PASSED' : 'VERIFICATION FAILED',
                  style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: FontWeight.w700,
                    color: _scanStatus == 'pass' ? AppColors.teal : AppColors.red, letterSpacing: 2)),
              ]),
            ),
            const SizedBox(height: 8),

            // Detailed comparison table
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderSubtle)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('SCAN RESULTS', style: Theme.of(context).textTheme.labelSmall),
                const SizedBox(height: 8),
                _CheckRow('SKU Match', _verifyResult!['skuMatch'] == true),
                _CheckRow('Brand Match', _verifyResult!['brandMatch'] == true),
                _CheckRow('Color Match', _verifyResult!['colorMatch'] == true),
                _CheckRow('Weight Check', _verifyResult!['weightResult'] == 'PASS' || _verifyResult!['weightResult'] == 'SKIP'),
              ]),
            ),
            const SizedBox(height: 8),

            // Scanned vs Expected comparison
            if (_verifyResult!['scanned'] != null && _verifyResult!['scanned']['error'] == null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderSubtle)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('COMPARISON', style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 8),
                  _CompareRow('Name', _verifyResult!['expected']['name'], _verifyResult!['scanned']['name']),
                  _CompareRow('Brand', _verifyResult!['expected']['brand'], _verifyResult!['scanned']['brand']),
                  _CompareRow('Color', _verifyResult!['expected']['color'], _verifyResult!['scanned']['color']),
                  if (_verifyResult!['weight'] != null)
                    _CompareRow('Weight',
                      '${_verifyResult!['weight']['expected']} kg',
                      '${_verifyResult!['weight']['actual']} kg'),
                ]),
              ),

            // Weight auto-check result
            if (_verifyResult!['weight'] != null && _verifyResult!['weightResult'] != 'SKIP') ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  border: Border(left: BorderSide(
                    color: _verifyResult!['weightResult'] == 'PASS' ? AppColors.teal
                      : _verifyResult!['weightResult'] == 'WARN' ? AppColors.amber : AppColors.red,
                    width: 3,
                  )),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('WEIGHT (AUTO-CHECKED FROM DB)', style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 6),
                  Row(children: [
                    _WeightBox('EXPECTED', '${_verifyResult!['weight']['expected']} kg', AppColors.blue),
                    const SizedBox(width: 8),
                    _WeightBox('ACTUAL', '${_verifyResult!['weight']['actual']} kg',
                      _verifyResult!['weightResult'] == 'PASS' ? AppColors.teal : AppColors.red),
                    const SizedBox(width: 8),
                    _WeightBox('DELTA', '${(_verifyResult!['weight']['delta'] as num).toStringAsFixed(3)} kg',
                      _verifyResult!['weightResult'] == 'PASS' ? AppColors.teal : AppColors.red),
                  ]),
                ]),
              ),
            ],
            const SizedBox(height: 12),
          ],

          // ── ORDER CHECKLIST ─────────────────────────────────
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderSubtle)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('ORDER CHECKLIST', style: Theme.of(context).textTheme.labelSmall),
              const SizedBox(height: 8),
              ...List.generate(_items.length, (i) {
                final item = _items[i];
                final done = i < _currentItemIndex || (i == _currentItemIndex && _scanStatus == 'pass');
                final current = i == _currentItemIndex && _scanStatus != 'pass';
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(children: [
                    Icon(done ? Icons.check_box : (current ? Icons.radio_button_on : Icons.check_box_outline_blank),
                      size: 18, color: done ? AppColors.teal : (current ? AppColors.orange : AppColors.textMuted)),
                    const SizedBox(width: 8),
                    Expanded(child: Text('${item['productName']} ×${item['quantity']}',
                      style: TextStyle(fontSize: 12, color: done ? AppColors.teal : (current ? Colors.white : AppColors.textMuted)))),
                  ]),
                );
              }),
            ]),
          ),
          const SizedBox(height: 12),

          // ── ACTIONS ─────────────────────────────────────────
          if (_scanStatus == 'pass')
            Column(children: [
              Row(children: [
                Expanded(child: ElevatedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, '/vision-check', arguments: _order),
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.purple),
                  icon: const Icon(Icons.photo_camera, size: 18),
                  label: const Text('AI VISION'),
                )),
                const SizedBox(width: 8),
                Expanded(child: ElevatedButton.icon(
                  onPressed: _nextItem,
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                  icon: const Icon(Icons.arrow_forward, size: 18),
                  label: Text(_currentItemIndex < _items.length - 1 ? 'NEXT ITEM' : 'COMPLETE'),
                )),
              ]),
              const SizedBox(height: 4),
              const Text('Optional: Take a photo for AI visual verification',
                style: TextStyle(fontSize: 9, color: AppColors.textMuted)),
            ]),
          if (_scanStatus == 'fail')
            Column(children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.red.withValues(alpha: 0.1), border: Border.all(color: AppColors.red)),
                child: const Text('WRONG PRODUCT — SCAN CORRECT ITEM', textAlign: TextAlign.center,
                  style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: AppColors.red, fontWeight: FontWeight.w700)),
              ),
              const SizedBox(height: 8),
              ElevatedButton.icon(
                onPressed: () => setState(() { _scanStatus = 'ready'; _verifyResult = null; _skuInputCtrl.clear(); }),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.red),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('RESCAN'),
              ),
            ]),
        ]),
      ),
    );
  }
}

// ── Helper Widgets ────────────────────────────────────────────

class _CornerBracket extends StatelessWidget {
  final Color color;
  final int rotation;
  const _CornerBracket({required this.color, required this.rotation});
  @override
  Widget build(BuildContext context) {
    return RotatedBox(
      quarterTurns: rotation,
      child: Container(
        width: 20, height: 20,
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: color, width: 2),
            left: BorderSide(color: color, width: 2),
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label, value;
  final Color? color;
  const _DetailRow(this.label, this.value, {this.color});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(children: [
        SizedBox(width: 60, child: Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, color: AppColors.textMuted))),
        Text(value, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: color ?? AppColors.textSecondary)),
      ]),
    );
  }
}

class _CheckRow extends StatelessWidget {
  final String label;
  final bool passed;
  const _CheckRow(this.label, this.passed);
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(children: [
        Icon(passed ? Icons.check_circle : Icons.cancel, size: 16, color: passed ? AppColors.teal : AppColors.red),
        const SizedBox(width: 8),
        Text(label, style: TextStyle(fontSize: 12, color: passed ? AppColors.teal : AppColors.red, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}

class _CompareRow extends StatelessWidget {
  final String label, expected, actual;
  const _CompareRow(this.label, this.expected, this.actual);
  @override
  Widget build(BuildContext context) {
    final match = expected.toLowerCase() == actual.toLowerCase();
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(children: [
        SizedBox(width: 60, child: Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, color: AppColors.textMuted))),
        Expanded(child: Text(expected, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: AppColors.blue))),
        const Text(' → ', style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
        Expanded(child: Text(actual, style: TextStyle(
          fontFamily: 'JetBrains Mono', fontSize: 11, color: match ? AppColors.teal : AppColors.red, fontWeight: FontWeight.w600))),
      ]),
    );
  }
}

class _WeightBox extends StatelessWidget {
  final String label, value;
  final Color color;
  const _WeightBox(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) {
    return Expanded(child: Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.05), border: Border.all(color: color.withValues(alpha: 0.3))),
      child: Column(children: [
        Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 8, color: AppColors.textMuted)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: FontWeight.w700, color: color)),
      ]),
    ));
  }
}
