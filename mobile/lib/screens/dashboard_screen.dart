import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/order_model.dart';
import '../services/dispatch_provider.dart';

/// Screen 02 — Packer Dashboard (Order Queue)
/// Matches the React emulator's "Assigned Packings Queue" view
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DispatchProvider>().loadOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final dp = context.watch<DispatchProvider>();
    final activeOrders = dp.orders.where((o) => o.status.isActive).toList();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Row(children: [
          Container(
            width: 28, height: 28,
            decoration: BoxDecoration(
              color: AppColors.orange.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: const Center(child: Text('W', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.orange))),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(dp.userName ?? 'Worker', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white)),
              Text(dp.workerId ?? 'WK-04219', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, color: AppColors.textMuted)),
            ],
          ),
        ]),
        actions: [
          TextButton(
            onPressed: () async {
              await dp.logout();
              if (context.mounted) Navigator.pushReplacementNamed(context, '/login');
            },
            child: const Text('Log out', style: TextStyle(fontSize: 11, color: AppColors.red)),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.orange,
        onRefresh: dp.loadOrders,
        child: ListView(
          padding: const EdgeInsets.all(12),
          children: [
            // Section header
            Text('ASSIGNED PACKINGS QUEUE',
              style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 2)),
            const SizedBox(height: 12),

            // Order cards or empty state
            if (activeOrders.isEmpty)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 40),
                decoration: BoxDecoration(
                  color: AppColors.surface.withValues(alpha: 0.4),
                  border: Border.all(color: AppColors.borderSubtle, style: BorderStyle.solid),
                ),
                child: Column(
                  children: [
                    Text('All orders fully processed.', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => dp.loadOrders(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.orange,
                        minimumSize: const Size(140, 32),
                        textStyle: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10),
                      ),
                      child: const Text('Refresh Orders'),
                    ),
                  ],
                ),
              )
            else
              ...activeOrders.map((order) => _OrderCard(
                order: order,
                onTap: () {
                  dp.selectOrder(order.id);
                  Navigator.pushNamed(context, '/box-selector');
                },
              )),

            const SizedBox(height: 24),

            // Streak incentives card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.teal.withValues(alpha: 0.05),
                border: Border.all(color: AppColors.teal.withValues(alpha: 0.15)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('STREAK INCENTIVES',
                    style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.teal)),
                  const SizedBox(height: 4),
                  Text(
                    'Pack 2 more packages accurately within error specs to secure your daily premium dispatch bonus!',
                    style: TextStyle(fontSize: 10, color: AppColors.textMuted, height: 1.4),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.orange,
        onPressed: () => Navigator.pushNamed(context, '/simulation-panel'),
        child: const Icon(Icons.speed, color: Colors.white, size: 22),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;
  final VoidCallback onTap;
  const _OrderCard({required this.order, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(color: AppColors.borderVisible),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(order.orderNumber,
                  style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.orange)),
                const SizedBox(height: 2),
                Text(order.customerName,
                  style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            )),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.amber.withValues(alpha: 0.1),
                border: Border.all(color: AppColors.amber.withValues(alpha: 0.3)),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(order.status.label,
                style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.amber)),
            ),
            const SizedBox(width: 8),
            Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}
