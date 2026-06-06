import 'package:flutter/material.dart';
import '../core/theme.dart';

/// Screen 05 — Weight Check (AUTO — Read Only)
/// Weight is automatically verified from the product database during barcode scan.
/// This screen is only shown as a quick summary if user navigates here manually.
/// The main flow now skips this screen — weight is checked in scan-verify.
class WeightCheckScreen extends StatelessWidget {
  const WeightCheckScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final order = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('WEIGHT STATUS')),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.teal.withValues(alpha: 0.05),
              border: Border.all(color: AppColors.teal),
            ),
            child: Column(children: [
              const Icon(Icons.scale, size: 48, color: AppColors.teal),
              const SizedBox(height: 12),
              const Text('AUTOMATED WEIGHT CHECK',
                style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.teal, letterSpacing: 1)),
              const SizedBox(height: 8),
              const Text('Weight verification is now automatic.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary), textAlign: TextAlign.center),
              const SizedBox(height: 4),
              const Text('When you scan a product barcode, the system automatically\ncompares the weight from the database — no manual entry needed.',
                style: TextStyle(fontSize: 11, color: AppColors.textMuted), textAlign: TextAlign.center),
            ]),
          ),
          const SizedBox(height: 16),

          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderSubtle)),
            child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('HOW IT WORKS', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: 1.5, color: AppColors.textMuted)),
              SizedBox(height: 8),
              _InfoRow(icon: Icons.qr_code_scanner, text: '1. Scan product barcode/QR code'),
              _InfoRow(icon: Icons.cloud_download, text: '2. Backend fetches product specs from DB'),
              _InfoRow(icon: Icons.compare_arrows, text: '3. Weight compared automatically (±tolerance)'),
              _InfoRow(icon: Icons.check_circle, text: '4. Result shown instantly — no manual input'),
            ]),
          ),
          const Spacer(),

          ElevatedButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back, size: 18),
            label: const Text('BACK TO SCAN'),
          ),
        ]),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoRow({required this.icon, required this.text});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(children: [
        Icon(icon, size: 16, color: AppColors.teal),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary))),
      ]),
    );
  }
}
