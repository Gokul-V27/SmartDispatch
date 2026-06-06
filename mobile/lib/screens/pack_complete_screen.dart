import 'package:flutter/material.dart';
import '../core/theme.dart';

class PackCompleteScreen extends StatelessWidget {
  const PackCompleteScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        automaticallyImplyLeading: false, // Prevent going back
        title: const Text('Success'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.check_circle, size: 96, color: AppColors.teal),
            const SizedBox(height: 24),
            const Text(
              'ORDER PACKED & SEALED',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'JetBrains Mono',
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.teal,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Box is ready for dispatch routing. Place on the outgoing conveyor.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: Border.all(color: AppColors.borderVisible),
              ),
              child: const Column(
                children: [
                  _SummaryRow(label: 'ORDER ID', value: 'ORD-9821-X'),
                  SizedBox(height: 8),
                  _SummaryRow(label: 'BOX SIZE', value: 'M (Medium)'),
                  SizedBox(height: 8),
                  _SummaryRow(label: 'ITEMS', value: '8'),
                  SizedBox(height: 8),
                  _SummaryRow(label: 'FINAL WEIGHT', value: '8.742 kg'),
                ],
              ),
            ),
            const SizedBox(height: 48),
            ElevatedButton(
              onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (r) => false),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.orange),
              child: const Text('BACK TO DASHBOARD'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  const _SummaryRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textMuted)),
        Text(value, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ],
    );
  }
}
