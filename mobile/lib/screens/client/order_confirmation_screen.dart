import 'package:flutter/material.dart';
import '../../core/theme.dart';

class OrderConfirmationScreen extends StatelessWidget {
  const OrderConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(automaticallyImplyLeading: false, title: const Text('Order Placed')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.check_circle, size: 96, color: AppColors.teal),
              const SizedBox(height: 24),
              const Text('ORDER SUCCESSFUL', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.teal)),
              const SizedBox(height: 12),
              const Text('Your order has been placed and is being sent to the packing hub.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderVisible)),
                child: const Column(
                  children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('ORDER ID', style: TextStyle(color: AppColors.textMuted)), Text('ORD-9825-A', style: TextStyle(fontWeight: FontWeight.bold))]),
                    SizedBox(height: 8),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('ETA', style: TextStyle(color: AppColors.textMuted)), Text('Today, 4:00 PM', style: TextStyle(fontWeight: FontWeight.bold))]),
                  ],
                ),
              ),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pushReplacementNamed(context, '/client-tracking'),
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                  child: const Text('TRACK ORDER'),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/client-home', (route) => false),
                  child: const Text('BACK TO HOME'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
