import 'package:flutter/material.dart';
import '../../core/theme.dart';

class DeliveryVerifyScreen extends StatelessWidget {
  const DeliveryVerifyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Verify Delivery')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.security, size: 64, color: AppColors.amber),
              const SizedBox(height: 24),
              const Text('DELIVERY OTP', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.amber, letterSpacing: 2)),
              const SizedBox(height: 8),
              const Text('Share this code with the delivery executive to confirm you have received the sealed package.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
                decoration: BoxDecoration(
                  color: AppColors.amber.withValues(alpha: 0.1),
                  border: Border.all(color: AppColors.amber, width: 2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('842 195', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 48, fontWeight: FontWeight.bold, color: AppColors.amber, letterSpacing: 8)),
              ),
              const SizedBox(height: 16),
              const Text('Expires in 04:59', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14, color: AppColors.textMuted)),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // Simulate driver accepting OTP
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Delivery Confirmed!')));
                    Navigator.pushNamedAndRemoveUntil(context, '/client-home', (r) => false);
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                  child: const Text('SIMULATE DELIVERY SUCCESS'),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
