import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../services/api_service.dart';

/// Screen 06 — Pack Complete
/// All 3 verifications passed → generates label with barcode + QR
class PackCompleteScreen extends StatefulWidget {
  const PackCompleteScreen({super.key});
  @override
  State<PackCompleteScreen> createState() => _PackCompleteScreenState();
}

class _PackCompleteScreenState extends State<PackCompleteScreen> with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _order;
  Map<String, dynamic>? _labelData;
  bool _loading = true;
  late AnimationController _animCtrl;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _scaleAnim = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _animCtrl, curve: Curves.elasticOut));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map<String, dynamic> && _order == null) {
      _order = args;
      _markPacked();
    }
  }

  Future<void> _markPacked() async {
    final api = context.read<ApiService>();
    // Update order status to PACKED
    await api.updateOrderStatus(_order!['id'], 'PACKED');
    // Get label data with barcode + QR
    final label = await api.getLabelData(_order!['id']);
    setState(() { _labelData = label; _loading = false; });
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('PACK COMPLETE')),
      body: _loading
        ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
            CircularProgressIndicator(color: AppColors.teal),
            SizedBox(height: 12),
            Text('Generating dispatch label...', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ]))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(12),
            child: Column(children: [
              // Success banner
              ScaleTransition(
                scale: _scaleAnim,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.teal.withValues(alpha: 0.1),
                    border: Border.all(color: AppColors.teal, width: 2),
                  ),
                  child: Column(children: [
                    const Icon(Icons.check_circle, size: 64, color: AppColors.teal),
                    const SizedBox(height: 12),
                    const Text('ALL VERIFIED', style: TextStyle(
                      fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.teal, letterSpacing: 2)),
                    const SizedBox(height: 4),
                    Text(_order?['orderNumber'] ?? '', style: const TextStyle(
                      fontFamily: 'JetBrains Mono', fontSize: 14, color: AppColors.textSecondary)),
                    const SizedBox(height: 12),
                    // Verification checklist
                    const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      _CheckItem(label: 'OCR', passed: true),
                      SizedBox(width: 16),
                      _CheckItem(label: 'VISION', passed: true),
                      SizedBox(width: 16),
                      _CheckItem(label: 'WEIGHT', passed: true),
                    ]),
                  ]),
                ),
              ),
              const SizedBox(height: 16),

              // Label preview card
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: AppColors.borderVisible),
                ),
                child: Column(children: [
                  // Orange header
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    color: AppColors.orange,
                    child: const Text('SMARTDISPATCH', style: TextStyle(
                      fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(_order?['orderNumber'] ?? '', style: const TextStyle(
                        fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: FontWeight.w700, color: Colors.black)),
                      const SizedBox(height: 8),
                      // Barcode placeholder
                      Container(
                        width: double.infinity, height: 50,
                        color: Colors.grey.shade200,
                        child: const Center(child: Text('||||||||||||||||||||||||', style: TextStyle(
                          fontFamily: 'JetBrains Mono', fontSize: 20, letterSpacing: 2, color: Colors.black))),
                      ),
                      const Divider(height: 24),
                      const Text('SHIP TO:', style: TextStyle(fontSize: 9, color: Colors.grey, fontFamily: 'JetBrains Mono')),
                      const SizedBox(height: 4),
                      Text(_order?['customerName'] ?? 'Customer', style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 14, color: Colors.black)),
                      const SizedBox(height: 8),
                      Text('Items: ${_order?['items']?.length ?? 0}', style: const TextStyle(fontSize: 12, color: Colors.black54)),
                      const SizedBox(height: 12),
                      // QR code placeholder
                      Align(
                        alignment: Alignment.centerRight,
                        child: Container(
                          width: 80, height: 80,
                          decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300)),
                          child: const Icon(Icons.qr_code_2, size: 60, color: Colors.black87),
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Align(
                        alignment: Alignment.centerRight,
                        child: Text('SCAN TO TRACK', style: TextStyle(fontSize: 8, color: Colors.grey, fontFamily: 'JetBrains Mono')),
                      ),
                    ]),
                  ),
                ]),
              ),
              const SizedBox(height: 16),

              // Actions
              Row(children: [
                Expanded(child: ElevatedButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Label sent to printer'), backgroundColor: AppColors.teal));
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.orange),
                  icon: const Icon(Icons.print, size: 18),
                  label: const Text('PRINT LABEL'),
                )),
                const SizedBox(width: 8),
                Expanded(child: ElevatedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, '/nfc-seal', arguments: _order),
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                  icon: const Icon(Icons.nfc, size: 18),
                  label: const Text('SEAL WITH NFC'),
                )),
              ]),
            ]),
          ),
    );
  }
}

class _CheckItem extends StatelessWidget {
  final String label;
  final bool passed;
  const _CheckItem({required this.label, required this.passed});
  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(passed ? Icons.check_circle : Icons.cancel, size: 16,
        color: passed ? AppColors.teal : AppColors.red),
      const SizedBox(width: 4),
      Text(label, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10,
        color: passed ? AppColors.teal : AppColors.red, fontWeight: FontWeight.w600)),
    ]);
  }
}
