import 'package:flutter/material.dart';
import '../core/theme.dart';

class TruckTrackingScreen extends StatelessWidget {
  const TruckTrackingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Truck Delivery: TRK-88'),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.orange.withValues(alpha: 0.1),
              border: Border.all(color: AppColors.orange.withValues(alpha: 0.3)),
            ),
            child: const Text(
              'IN TRANSIT',
              style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.orange),
            ),
          )
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Map Placeholder
          Container(
            height: 200,
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(bottom: BorderSide(color: AppColors.borderVisible)),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                const Opacity(
                  opacity: 0.1,
                  child: Icon(Icons.map, size: 120, color: AppColors.textMuted),
                ),
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.local_shipping, size: 48, color: AppColors.orange),
                    const SizedBox(height: 8),
                    const Text('GPS TRACKING ACTIVE', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.orange)),
                    Text('ETA: 14 mins (3.2 km away)', style: TextStyle(fontSize: 12, color: AppColors.textSecondary.withValues(alpha: 0.8))),
                  ],
                )
              ],
            ),
          ),

          // Inventory List
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Truck Inventory (12/12 Boxes)', style: Theme.of(context).textTheme.labelSmall),
                const Icon(Icons.filter_list, size: 16, color: AppColors.textMuted),
              ],
            ),
          ),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _buildBoxCard('ORD-9825-A', 'Customer A', true),
                _buildBoxCard('ORD-9824-B', 'Customer B', true),
                _buildBoxCard('ORD-9821-X', 'Customer X', false), // Pending
                _buildBoxCard('ORD-9820-C', 'Customer C', false),
              ],
            ),
          ),

          // Actions
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.red,
                      side: BorderSide(color: AppColors.red.withValues(alpha: 0.5)),
                    ),
                    child: const Text('RETURN BOX'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                    child: const Text('DELIVER SELECTED'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBoxCard(String boxId, String customer, bool delivered) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: delivered ? AppColors.surface.withValues(alpha: 0.5) : AppColors.surface,
        border: Border.all(color: delivered ? AppColors.borderSubtle : AppColors.borderVisible),
      ),
      child: Row(
        children: [
          Container(
            width: 20, height: 20,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: delivered ? AppColors.teal : Colors.transparent,
              border: Border.all(color: delivered ? AppColors.teal : AppColors.borderVisible),
            ),
            child: delivered ? const Icon(Icons.check, size: 12, color: Colors.black) : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(boxId, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: FontWeight.bold, color: delivered ? AppColors.textMuted : AppColors.textPrimary)),
                Text(customer, style: TextStyle(fontSize: 11, color: AppColors.textSecondary.withValues(alpha: delivered ? 0.5 : 1))),
              ],
            ),
          ),
          Text(
            delivered ? 'DELIVERED' : 'IN TRUCK',
            style: TextStyle(
              fontFamily: 'JetBrains Mono',
              fontSize: 10,
              color: delivered ? AppColors.teal : AppColors.orange,
            ),
          ),
        ],
      ),
    );
  }
}
