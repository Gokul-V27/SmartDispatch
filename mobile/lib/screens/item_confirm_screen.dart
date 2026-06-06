import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../core/color_utils.dart';
import '../services/packing_provider.dart';

class ItemConfirmScreen extends StatefulWidget {
  const ItemConfirmScreen({super.key});

  @override
  State<ItemConfirmScreen> createState() => _ItemConfirmScreenState();
}

class _ItemConfirmScreenState extends State<ItemConfirmScreen> {
  @override
  void initState() {
    super.initState();
    
    final packProv = Provider.of<PackingProvider>(context, listen: false);
    if (packProv.isAutoProcessing) {
      Future.delayed(const Duration(milliseconds: 1500), () {
        if (!mounted) return;
        _confirmItem(packProv);
      });
    }
  }

  void _confirmItem(PackingProvider packProv) {
    packProv.confirmCurrentItemPacked();
    
    if (packProv.isOrderComplete) {
      Navigator.pushReplacementNamed(context, '/pack-complete');
    } else {
      Navigator.pushReplacementNamed(context, '/barcode-scan');
    }
  }

  @override
  Widget build(BuildContext context) {
    final packProv = Provider.of<PackingProvider>(context);
    final item = packProv.currentItem;
    
    if (item == null) {
      return const Scaffold(body: Center(child: Text('Error: No active item')));
    }

    final gates = packProv.currentItemGates;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Confirmation'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Target Info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderVisible),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(
                      color: ColorUtils.parseColor(item.productColor),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.borderVisible),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.productName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                        const SizedBox(height: 4),
                        Text('SKU: ${item.productSku}', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textMuted)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),

            // Gates
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('VERIFICATION RESULTS', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 12),

            _buildGateRow(GateType.boxIntegrity, 'Box Integrity Check', gates),
            _buildGateRow(GateType.identity, 'Identity & Barcode', gates),
            _buildGateRow(GateType.color, 'Color Match (ΔE < 15)', gates),
            _buildGateRow(GateType.category, 'ML Category Verification', gates),
            _buildGateRow(GateType.size, 'Size & Volume Fit', gates),

            const SizedBox(height: 32),
            
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.teal.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.teal.withValues(alpha: 0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.shield, color: AppColors.teal),
                  SizedBox(width: 16),
                  Expanded(
                    child: Text('Item successfully passed all 5 automated gates. Ready to pack.', style: TextStyle(color: AppColors.teal, fontWeight: FontWeight.w500)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (packProv.isAutoProcessing)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: AppColors.teal, strokeWidth: 2)),
                      SizedBox(width: 8),
                      Text('Auto-proceeding...', style: TextStyle(color: AppColors.teal, fontFamily: 'JetBrains Mono', fontSize: 12)),
                    ],
                  ),
                ),
              ElevatedButton.icon(
                onPressed: () => _confirmItem(packProv),
                icon: const Icon(Icons.archive),
                label: const Text('CONFIRM & PACK ITEM'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.teal,
                  minimumSize: const Size.fromHeight(56),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => Navigator.pushReplacementNamed(context, '/barcode-scan'),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.red,
                  minimumSize: const Size.fromHeight(48),
                ),
                child: const Text('REJECT & RESCAN'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGateRow(GateType gate, String title, Map<GateType, bool> gates) {
    final passed = gates[gate] ?? false;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(passed ? Icons.check_circle : Icons.error, color: passed ? AppColors.teal : AppColors.red, size: 20),
          const SizedBox(width: 12),
          Text(title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
