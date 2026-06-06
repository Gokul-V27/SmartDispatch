import 'package:flutter/material.dart';
import '../../core/theme.dart';

class MyOrdersScreen extends StatelessWidget {
  const MyOrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('My Orders')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildOrderCard(context, 'ORD-9825-A', 'Today, 10:30 AM', '3 Items · ₹1,089', 'IN TRANSIT', AppColors.blue, true),
          _buildOrderCard(context, 'ORD-9710-B', '12 May 2026', '5 Items · ₹2,450', 'DELIVERED', AppColors.teal, false),
          _buildOrderCard(context, 'ORD-9605-C', '01 May 2026', '1 Item · ₹499', 'DELIVERED', AppColors.teal, false),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.teal,
        unselectedItemColor: AppColors.textMuted,
        currentIndex: 1, // Orders tab
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long), label: 'Orders'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
        onTap: (idx) {
          if (idx == 0) Navigator.pushNamedAndRemoveUntil(context, '/client-home', (r) => false);
        },
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, String id, String date, String details, String status, Color statusColor, bool isActive) {
    return GestureDetector(
      onTap: () {
        if (isActive) Navigator.pushNamed(context, '/client-tracking');
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderVisible)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(id, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), border: Border.all(color: statusColor)),
                  child: Text(status, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: statusColor, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(date, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            const SizedBox(height: 8),
            Text(details, style: const TextStyle(color: AppColors.textPrimary)),
            if (isActive) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Navigator.pushNamed(context, '/client-tracking'),
                  child: const Text('TRACK ORDER'),
                ),
              )
            ]
          ],
        ),
      ),
    );
  }
}
