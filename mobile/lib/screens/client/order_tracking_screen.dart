import 'package:flutter/material.dart';
import '../../core/theme.dart';

class OrderTrackingScreen extends StatelessWidget {
  const OrderTrackingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Track Order: ORD-9825-A')),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(bottom: BorderSide(color: AppColors.borderVisible)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Arriving Today', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                    SizedBox(height: 4),
                    Text('4:15 PM', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.teal)),
                  ],
                ),
                Icon(Icons.local_shipping, size: 48, color: AppColors.orange.withValues(alpha: 0.8)),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                _buildTimelineStep(context, 'Order Placed', '10:30 AM', true, true),
                _buildTimelineStep(context, 'Packing Started (WK-04219)', '10:45 AM', true, true),
                _buildTimelineStep(context, 'Quality Check Passed', '10:52 AM', true, true),
                _buildTimelineStep(context, 'NFC Sealed — Tamper-proof', '10:55 AM', true, true),
                _buildTimelineStep(context, 'Out for Delivery (TRK-88)', '11:10 AM', true, true),
                _buildTimelineStep(context, 'Arriving at your door', 'ETA 4:15 PM', false, false, isLast: true),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.pushNamed(context, '/client-delivery-verify'),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal, padding: const EdgeInsets.all(16)),
                icon: const Icon(Icons.verified, size: 20),
                label: const Text('VERIFY DELIVERY OTP'),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildTimelineStep(BuildContext context, String title, String time, bool isDone, bool isCurrent, {bool isLast = false}) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Column(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDone ? AppColors.teal : AppColors.surface,
                  border: Border.all(color: isDone ? AppColors.teal : AppColors.textMuted),
                ),
                child: isDone ? const Icon(Icons.check, size: 14, color: Colors.black) : null,
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: isDone ? AppColors.teal : AppColors.borderVisible,
                  ),
                )
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontSize: 16, fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal, color: isDone || !isCurrent ? AppColors.textPrimary : AppColors.textSecondary)),
                  const SizedBox(height: 4),
                  Text(time, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textMuted)),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
