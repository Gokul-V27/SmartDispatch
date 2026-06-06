import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

/// Screen 02 — Packer Dashboard
/// Shows order queue, stats, and packing actions
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<dynamic> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _loading = true);
    final api = context.read<ApiService>();
    final orders = await api.getOrders();
    setState(() { _orders = orders; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final pending = _orders.where((o) => o['status'] == 'PENDING' || o['status'] == 'ASSIGNED').toList();
    final packed = _orders.where((o) => o['status'] == 'PACKED').length;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: RichText(text: const TextSpan(children: [
          TextSpan(text: 'SMART', style: TextStyle(color: Colors.white, fontFamily: 'JetBrains Mono', fontWeight: FontWeight.w700, fontSize: 16)),
          TextSpan(text: 'DISPATCH', style: TextStyle(color: AppColors.orange, fontFamily: 'JetBrains Mono', fontWeight: FontWeight.w700, fontSize: 16)),
        ])),
        actions: [
          IconButton(icon: const Icon(Icons.logout, size: 20), onPressed: () async {
            await auth.logout();
            Navigator.pushReplacementNamed(context, '/login');
          }),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadOrders,
        child: ListView(
          padding: const EdgeInsets.all(12),
          children: [
            // Worker info
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Row(children: [
                const Icon(Icons.badge, color: AppColors.orange, size: 20),
                const SizedBox(width: 8),
                Text(auth.userName ?? 'Packer', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.orange),
                    color: AppColors.orange.withValues(alpha: 0.1),
                  ),
                  child: Text(auth.workerId ?? '', style: const TextStyle(
                    fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.orange, fontWeight: FontWeight.w600)),
                ),
              ]),
            ),
            const SizedBox(height: 12),

            // Stats row
            Row(children: [
              _StatCard(value: '${pending.length}', label: 'TO PACK', color: AppColors.orange),
              const SizedBox(width: 8),
              _StatCard(value: '$packed', label: 'PACKED', color: AppColors.teal),
            ]),
            const SizedBox(height: 12),

            // Quick actions strip
            Row(children: [
              _QuickAction(icon: Icons.nfc, label: 'NFC DELIVERY', color: AppColors.blue,
                onTap: () => Navigator.pushNamed(context, '/nfc-delivery')),
              const SizedBox(width: 8),
              _QuickAction(icon: Icons.qr_code_scanner, label: 'SCAN TAG', color: AppColors.purple,
                onTap: () {}),
            ]),
            const SizedBox(height: 16),

            // Section header
            Text('ORDER QUEUE', style: Theme.of(context).textTheme.labelSmall),
            const SizedBox(height: 8),

            // Loading
            if (_loading) const Center(child: CircularProgressIndicator(color: AppColors.orange)),

            // Order cards
            if (!_loading && pending.isEmpty)
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderSubtle)),
                child: const Center(child: Text('No pending orders', style: TextStyle(color: AppColors.textMuted))),
              ),

            ...pending.map((order) => _OrderCard(
              order: order,
              onStartPacking: () {
                Navigator.pushNamed(context, '/ocr-scan', arguments: order);
              },
            )),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value, label;
  final Color color;
  const _StatCard({required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value, style: TextStyle(
          fontFamily: 'JetBrains Mono', fontSize: 28, fontWeight: FontWeight.w700, color: color)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(
          fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: 1.5, color: AppColors.textMuted)),
      ]),
    ));
  }
}

class _OrderCard extends StatelessWidget {
  final Map<String, dynamic> order;
  final VoidCallback onStartPacking;
  const _OrderCard({required this.order, required this.onStartPacking});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.borderSubtle),
        borderRadius: BorderRadius.zero,
      ),
      child: Column(children: [
        // Orange accent stripe top
        Container(height: 3, color: AppColors.orange),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Text(order['orderNumber'] ?? '', style: const TextStyle(
                fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: FontWeight.w700)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.textMuted),
                  color: AppColors.elevated,
                ),
                child: Text(order['status'] ?? '', style: const TextStyle(
                  fontFamily: 'JetBrains Mono', fontSize: 9, color: AppColors.textMuted)),
              ),
            ]),
            const SizedBox(height: 8),
            Text('${order['customerName'] ?? 'Customer'} · ${order['items']?.length ?? 0} items',
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onStartPacking,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                icon: const Icon(Icons.play_arrow, size: 18),
                label: const Text('START PACKING'),
              ),
            ),
          ]),
        ),
      ]),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _QuickAction({required this.icon, required this.label, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Expanded(child: GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.05),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(
            fontFamily: 'JetBrains Mono', fontSize: 9, color: color, fontWeight: FontWeight.w600, letterSpacing: 1)),
        ]),
      ),
    ));
  }
}
