import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/order_model.dart';
import '../services/dispatch_provider.dart';
import '../services/packing_provider.dart';

/// Simulation Panel (replaces React right-panel)
/// Contains: Auto-Pilot, Calibration Lab, Live Terminal
class SimulationPanelScreen extends StatelessWidget {
  const SimulationPanelScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final dp = context.watch<DispatchProvider>();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('SIMULATION CONTROL', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 13)),
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // ── ML Packing Flow Mode ───────────────────────
          _SectionHeader(title: '🤖 ML PACKING FLOW MODE', color: AppColors.purple),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(color: AppColors.borderSubtle),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Auto-Process Mode', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                    Text(context.watch<PackingProvider>().isAutoProcessing ? 'Enabled (Default)' : 'Manual Step-by-Step', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                  ],
                ),
                Switch(
                  value: context.watch<PackingProvider>().isAutoProcessing,
                  activeColor: AppColors.purple,
                  onChanged: (val) => context.read<PackingProvider>().setAutoProcess(val),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ── Auto-Pilot Section ─────────────────────────
          _SectionHeader(title: '⚡ LEGACY AUTO-PILOT RUNNER', color: AppColors.orange),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(color: AppColors.borderSubtle),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sequentially processes all verification steps for an order: OCR → Vision → Weight → NFC Seal → Delivery.',
                  style: TextStyle(fontSize: 10, color: AppColors.textMuted, height: 1.3),
                ),
                const SizedBox(height: 10),

                // Order selector
                if (dp.orders.where((o) => o.status.isActive).isNotEmpty) ...[
                  Text('SELECT ORDER', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, color: AppColors.textMuted, letterSpacing: 1)),
                  const SizedBox(height: 4),
                  ...dp.orders.where((o) => o.status.isActive).map((order) => GestureDetector(
                    onTap: dp.isAutoPiloting ? null : () async {
                      await dp.runAutoPilot(order.id);
                    },
                    child: Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.orange.withValues(alpha: 0.06),
                        border: Border.all(color: AppColors.orange.withValues(alpha: 0.2)),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(order.orderNumber, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.orange)),
                          Text('⚡ RUN', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.orange)),
                        ],
                      ),
                    ),
                  )),
                ] else
                  Text('No active orders to autopilot.', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),

                if (dp.isAutoPiloting) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.orange)),
                      const SizedBox(width: 8),
                      Text('Speed-Running dispatch...', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.orange)),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ── Calibration Lab ────────────────────────────
          _SectionHeader(title: '⚖️ CALIBRATION LABORATORY', color: AppColors.blue),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border.all(color: AppColors.borderSubtle),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Current Weight', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
                    Text('${dp.weightInput.toStringAsFixed(2)} kg',
                      style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
                  ],
                ),
                const SizedBox(height: 8),
                SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor: AppColors.blue,
                    thumbColor: AppColors.blue,
                    inactiveTrackColor: AppColors.borderSubtle,
                  ),
                  child: Slider(
                    value: dp.weightInput,
                    min: 0.5,
                    max: 4.0,
                    divisions: 70,
                    onChanged: dp.setWeightInput,
                  ),
                ),
                // Tolerance indicator
                _ToleranceBar(weight: dp.weightInput, expected: 1.5, toleranceKg: 0.15),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ── Telemetry Alerts ────────────────────────────
          if (dp.alerts.isNotEmpty) ...[
            _SectionHeader(title: '🚨 TELEMETRY ALERTS (${dp.alerts.length})', color: AppColors.red),
            const SizedBox(height: 6),
            ...dp.alerts.take(5).map((alert) => Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.red.withValues(alpha: 0.05),
                border: Border.all(color: AppColors.red.withValues(alpha: 0.15)),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        color: AppColors.red.withValues(alpha: 0.2),
                        child: Text(alert.severity, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: FontWeight.w700, color: AppColors.red)),
                      ),
                      const SizedBox(width: 6),
                      Text(alert.orderNumber, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.orange)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(alert.detail, style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                ],
              ),
            )),
            const SizedBox(height: 16),
          ],

          // ── Live Terminal Console ──────────────────────
          _SectionHeader(title: '📟 LIVE SIMULATION LOG', color: AppColors.teal),
          const SizedBox(height: 6),
          Container(
            height: 300,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.black,
              border: Border.all(color: AppColors.teal.withValues(alpha: 0.15)),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Column(
              children: [
                // Terminal header
                Row(
                  children: [
                    Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.teal)),
                    const SizedBox(width: 6),
                    Text('smartdispatch@terminal ~', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, color: AppColors.teal.withValues(alpha: 0.6))),
                    const Spacer(),
                    GestureDetector(
                      onTap: dp.clearLogs,
                      child: Text('clear', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 8, color: AppColors.textMuted)),
                    ),
                  ],
                ),
                Divider(color: AppColors.teal.withValues(alpha: 0.1)),
                // Log output
                Expanded(
                  child: dp.simLogs.isEmpty
                    ? Center(child: Text('Awaiting dispatch events...', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)))
                    : ListView.builder(
                        reverse: true,
                        itemCount: dp.simLogs.length,
                        itemBuilder: (_, i) {
                          final log = dp.simLogs[dp.simLogs.length - 1 - i];
                          Color logColor = AppColors.teal;
                          if (log.contains('[ERROR]')) logColor = AppColors.red;
                          if (log.contains('⚠')) logColor = AppColors.amber;
                          if (log.contains('═══')) logColor = AppColors.orange;
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 1),
                            child: Text(log,
                              style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, color: logColor.withValues(alpha: 0.8), height: 1.3)),
                          );
                        },
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final Color color;
  const _SectionHeader({required this.title, required this.color});
  @override
  Widget build(BuildContext context) {
    return Text(title,
      style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: FontWeight.w700, color: color, letterSpacing: 1));
  }
}

class _ToleranceBar extends StatelessWidget {
  final double weight, expected, toleranceKg;
  const _ToleranceBar({required this.weight, required this.expected, required this.toleranceKg});

  @override
  Widget build(BuildContext context) {
    final delta = weight - expected;
    final isPass = delta.abs() <= toleranceKg;
    final isWarn = delta.abs() > toleranceKg && delta.abs() <= toleranceKg * 2;
    Color barColor = isPass ? AppColors.teal : (isWarn ? AppColors.amber : AppColors.red);

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Tolerance ±${(toleranceKg * 1000).round()}g', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 8, color: AppColors.textMuted)),
            Text('Delta: ${(delta * 1000).round()}g', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: FontWeight.w700, color: barColor)),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: ((weight / 4.0)).clamp(0, 1),
          backgroundColor: AppColors.borderSubtle,
          valueColor: AlwaysStoppedAnimation(barColor),
          minHeight: 4,
        ),
      ],
    );
  }
}
