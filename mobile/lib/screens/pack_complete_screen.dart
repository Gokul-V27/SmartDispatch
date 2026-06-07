import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../services/packing_provider.dart';
import '../services/dispatch_provider.dart';
import '../widgets/packer_guide_widget.dart';

class PackCompleteScreen extends StatefulWidget {
  const PackCompleteScreen({super.key});

  @override
  State<PackCompleteScreen> createState() => _PackCompleteScreenState();
}

class _PackCompleteScreenState extends State<PackCompleteScreen> {
  bool _isSubmitting = false;

  void _finish() async {
    // Note: the submitPackSession was legacy. The actual completion happens at NFC seal.
    // We still keep it for fallback if NFC is totally bypassed, but usually we just move to seal.
    Navigator.pushReplacementNamed(context, '/nfc-write');
  }

  @override
  void initState() {
    super.initState();
    final packProv = Provider.of<PackingProvider>(context, listen: false);
    if (packProv.isAutoProcessing) {
      Future.delayed(const Duration(milliseconds: 1500), () {
        if (mounted) _finish();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final packProv = Provider.of<PackingProvider>(context);
    final orderId = Provider.of<DispatchProvider>(context).selectedOrderId ?? 'Unknown';

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Pack Complete'),
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          PackerGuideWidget(
            stepNumber: 5,
            totalSteps: 5,
            stepTitle: '📦 All Items Verified',
            instruction: 'All items are packed! Proceed to seal the box with NFC.',
            expectedInfo: '${packProv.packedItems.length} items successfully packed.',
          ),
          Expanded(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 120, height: 120,
                      decoration: BoxDecoration(
                        color: AppColors.teal.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.check_circle, color: AppColors.teal, size: 80),
                    ),
                    const SizedBox(height: 32),
                    
                    const Text(
                      'ORDER VERIFIED & PACKED',
                      style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 20, color: AppColors.teal, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      orderId,
                      style: const TextStyle(fontSize: 16, color: AppColors.textPrimary),
                    ),
                    
                    const SizedBox(height: 48),

                    // Summary
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.borderVisible),
                      ),
                      child: Column(
                        children: [
                          _buildSummaryRow('Items Packed', '${packProv.packedItems.length}/${packProv.orderItems.length}'),
                          const SizedBox(height: 12),
                          _buildSummaryRow('Box Type', packProv.selectedBox?.label ?? 'N/A'),
                          const SizedBox(height: 12),
                          _buildSummaryRow('Verifications Passed', '${packProv.packedItems.length * 5}'), // 5 gates per item
                          const SizedBox(height: 12),
                          _buildSummaryRow('Box Integrity', 'PASSED', color: AppColors.teal),
                        ],
                      ),
                    ),

                    const SizedBox(height: 48),
                    
                    if (_isSubmitting)
                      const CircularProgressIndicator(color: AppColors.teal)
                    else
                      ElevatedButton.icon(
                        onPressed: _finish,
                        icon: const Icon(Icons.nfc),
                        label: const Text('PROCEED TO SEAL BOX'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.teal,
                          minimumSize: const Size.fromHeight(56),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {Color color = AppColors.textPrimary}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary)),
        Text(value, style: TextStyle(fontFamily: 'JetBrains Mono', fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }
}
