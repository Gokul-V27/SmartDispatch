import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../services/cart_service.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String _paymentMethod = 'UPI';
  String _timeSlot = 'Today, 4 PM - 6 PM';

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartService>();
    final total = cart.subtotal + 50;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Checkout')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Delivery Address
            const Text('Delivery Address', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderSubtle)),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Priya Sharma', style: TextStyle(fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('Flat 4B, Green View Apartments\nSector 44, Gurgaon 122003\nPh: +91 98765 43210', style: TextStyle(color: AppColors.textSecondary, height: 1.5)),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Time Slot
            const Text('Delivery Slot', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              color: AppColors.surface,
              child: DropdownButtonFormField<String>(
                value: _timeSlot,
                decoration: const InputDecoration(border: OutlineInputBorder()),
                items: ['Today, 4 PM - 6 PM', 'Today, 6 PM - 8 PM', 'Tomorrow, 9 AM - 11 AM']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (v) => setState(() => _timeSlot = v!),
              ),
            ),
            const SizedBox(height: 24),

            // Payment Method
            const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Column(
              children: ['UPI', 'Credit/Debit Card', 'Cash on Delivery'].map((m) => RadioListTile<String>(
                title: Text(m),
                value: m,
                groupValue: _paymentMethod,
                onChanged: (v) => setState(() => _paymentMethod = v!),
                activeColor: AppColors.teal,
                contentPadding: EdgeInsets.zero,
              )).toList(),
            ),
            const SizedBox(height: 24),

            // Place Order
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  cart.clear();
                  Navigator.pushReplacementNamed(context, '/client-confirmation');
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal, padding: const EdgeInsets.all(16)),
                child: Text('PLACE ORDER (₹${total.toStringAsFixed(0)})'),
              ),
            )
          ],
        ),
      ),
    );
  }
}
