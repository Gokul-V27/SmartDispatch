import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../core/animations.dart';
import '../models/order_model.dart';
import '../services/dispatch_provider.dart';

/// Core packing flow screen — Combined OCR + Vision + Weight verification per item.
/// Matches the React emulator's scanning detail screen.
class PackingFlowScreen extends StatelessWidget {
  const PackingFlowScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final dp = context.watch<DispatchProvider>();
    final order = dp.selectedOrder;

    if (order == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.pop(context);
      });
      return const Scaffold(backgroundColor: AppColors.bg);
    }

    final allVerified = order.allItemsVerified;
    final itemIdx = dp.activeItemIndex.clamp(0, order.items.length - 1);
    final item = order.items[itemIdx];

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            // ── Top nav bar ─────────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              color: AppColors.surface,
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      dp.selectOrder(null);
                      Navigator.pop(context);
                    },
                    child: const Text('← Back', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: AppColors.textMuted)),
                  ),
                  const Spacer(),
                  Text(order.orderNumber, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(12),
                child: !allVerified
                  ? _ScanView(dp: dp, item: item, itemIdx: itemIdx, totalItems: order.items.length)
                  : _NfcReadyView(dp: dp, orderId: order.id, isPacked: order.status.label == 'PACKED'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Scanning/verification UI for a single item
class _ScanView extends StatelessWidget {
  final DispatchProvider dp;
  final dynamic item;
  final int itemIdx;
  final int totalItems;
  const _ScanView({required this.dp, required this.item, required this.itemIdx, required this.totalItems});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Item info
        Text('VERIFYING ITEM ${itemIdx + 1}/$totalItems',
          style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 1)),
        const SizedBox(height: 4),
        Text(item.productName,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
        Text('Target SKU: ${item.productSku}',
          style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
        const SizedBox(height: 12),

        // ── Virtual Camera Viewfinder ────────────────────
        Container(
          height: 120,
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppColors.surface,
            border: Border.all(color: AppColors.borderVisible),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Stack(
            children: [
              // Corner brackets
              Positioned(top: 8, left: 8, child: _Corner(top: true, left: true)),
              Positioned(top: 8, right: 8, child: _Corner(top: true, left: false)),
              Positioned(bottom: 8, left: 8, child: _Corner(top: false, left: true)),
              Positioned(bottom: 8, right: 8, child: _Corner(top: false, left: false)),

              // Scan line
              const Positioned.fill(child: ScanLineAnimation(height: 120)),

              // QR scanner active overlay
              if (dp.isQrScannerActive)
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.teal.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.qr_code_2, size: 36, color: AppColors.teal),
                        const SizedBox(height: 4),
                        Text('QR SCANNER ACTIVE',
                          style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.teal, letterSpacing: 2)),
                      ],
                    ),
                  ),
                )
              else
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.view_column_outlined, size: 28, color: Colors.white.withValues(alpha: 0.2)),
                      const SizedBox(height: 4),
                      Text('ALIGN FOR INTEGRATED SCAN',
                        style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, color: AppColors.textMuted)),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 10),

        // ── Verification checklist ───────────────────────
        Row(
          children: [
            _CheckBadge(label: 'OCR SKU', passed: item.ocrVerified),
            const SizedBox(width: 6),
            _CheckBadge(label: 'COLOR RGB', passed: item.visionVerified),
            const SizedBox(width: 6),
            _CheckBadge(label: 'WEIGHT BEAM', passed: item.weightVerified),
          ],
        ),
        const SizedBox(height: 10),

        // ── Action buttons ───────────────────────────────
        Row(
          children: [
            Expanded(
              child: _ActionBtn(
                label: 'Simulate Barcode',
                icon: Icons.view_column_outlined,
                color: AppColors.orange,
                onTap: () async {
                  await dp.verifyOcr(item.id);
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _ActionBtn(
                label: 'Verify QR Scanner',
                icon: Icons.qr_code_2,
                color: AppColors.blue,
                onTap: () async {
                  await dp.simulateQrScan(item.id);
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),

        // Vision verify
        SizedBox(
          width: double.infinity,
          child: _ActionBtn(
            label: '2. Simulate RGB Casing Verify',
            icon: null,
            color: AppColors.orange,
            onTap: () async {
              await dp.verifyVision(item.id);
            },
          ),
        ),
        const SizedBox(height: 6),

        // Weight input
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.surface,
            border: Border.all(color: AppColors.borderSubtle),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Dynamic weight input:', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
                  Text('${dp.weightInput.toStringAsFixed(2)} kg',
                    style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                ],
              ),
              const SizedBox(height: 6),
              SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  activeTrackColor: AppColors.orange,
                  thumbColor: AppColors.orange,
                  inactiveTrackColor: AppColors.borderSubtle,
                  overlayColor: AppColors.orange.withValues(alpha: 0.15),
                ),
                child: Slider(
                  value: dp.weightInput,
                  min: 0.5,
                  max: 4.0,
                  divisions: 70,
                  onChanged: (v) => dp.setWeightInput(v),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('0.50kg', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 8, color: AppColors.textMuted)),
                  Text('1.50kg', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 8, color: AppColors.teal)),
                  Text('4.00kg', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 8, color: AppColors.textMuted)),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        await dp.verifyWeight(item.id, dp.weightInput);
                        // Advance if all done
                        if (item.isFullyVerified) dp.advanceToNextItem();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.blue.withValues(alpha: 0.2),
                        foregroundColor: AppColors.blue,
                        minimumSize: const Size(0, 32),
                        textStyle: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                        side: BorderSide(color: AppColors.blue.withValues(alpha: 0.3)),
                      ),
                      child: const Text('Compare against limits'),
                    ),
                  ),
                  const SizedBox(width: 6),
                  ElevatedButton(
                    onPressed: () => dp.setWeightInput(1.5),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.elevated,
                      foregroundColor: AppColors.textMuted,
                      minimumSize: const Size(80, 32),
                      textStyle: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                      side: BorderSide(color: AppColors.borderVisible),
                    ),
                    child: const Text('Standardize'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// NFC-ready view (all items verified) — shows seal button
class _NfcReadyView extends StatelessWidget {
  final DispatchProvider dp;
  final String orderId;
  final bool isPacked;
  const _NfcReadyView({required this.dp, required this.orderId, required this.isPacked});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 40),
        // Animated NFC waves
        SizedBox(
          width: 140, height: 140,
          child: Stack(
            alignment: Alignment.center,
            children: [
              RadarRipple(size: 140, color: AppColors.teal, delay: 0.0),
              RadarRipple(size: 110, color: AppColors.teal, delay: 0.3),
              RadarRipple(size: 80, color: AppColors.teal, delay: 0.6),
              RotatingDashedCircle(size: 120, color: AppColors.teal),
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.teal.withValues(alpha: 0.15),
                  border: Border.all(color: AppColors.teal.withValues(alpha: 0.4)),
                  boxShadow: [BoxShadow(color: AppColors.teal.withValues(alpha: 0.2), blurRadius: 15)],
                ),
                child: const Icon(Icons.wifi, size: 26, color: AppColors.teal),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.teal)),
            const SizedBox(width: 6),
            const Text('Sensors Approved ✓',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 1)),
          ],
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            'SKU & gross weight specifications successfully secured. Tap to bind the cryptographic proof into the physical box NFC RFID coin tag.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 10, color: AppColors.textMuted, height: 1.5),
          ),
        ),
        const SizedBox(height: 20),

        if (!isPacked)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: dp.isNfcHandshaking ? null : () async {
                await dp.sealWithNfc(orderId);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.teal,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 44),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                textStyle: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1),
              ),
              child: const Text('🔋 Tap simulated NFC tag'),
            ),
          )
        else
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.teal.withValues(alpha: 0.08),
              border: Border.all(color: AppColors.teal.withValues(alpha: 0.2)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('LEDGER:', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.teal)),
                    Text('NFC RFID BIND COMPLETE', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.teal)),
                  ],
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      await dp.simulateDelivery(orderId);
                      if (context.mounted) Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.surface,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 36),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      textStyle: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10),
                    ),
                    child: const Text('Simulate House Handover (OTP Match)'),
                  ),
                ),
              ],
            ),
          ),

        // NFC Handshake overlay
        if (dp.isNfcHandshaking) ...[
          const SizedBox(height: 20),
          _NfcHandshakeOverlay(dp: dp),
        ],
      ],
    );
  }
}

/// NFC handshaking overlay with cosmic radar effects
class _NfcHandshakeOverlay extends StatelessWidget {
  final DispatchProvider dp;
  const _NfcHandshakeOverlay({required this.dp});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF090F1E).withValues(alpha: 0.95),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          // Radar ripples (cyan)
          SizedBox(
            width: 100, height: 100,
            child: Stack(
              alignment: Alignment.center,
              children: [
                RadarRipple(size: 100, color: Colors.cyanAccent, duration: const Duration(milliseconds: 1500)),
                RadarRipple(size: 75, color: Colors.cyanAccent, duration: const Duration(milliseconds: 1500), delay: 0.3),
                SpinningRing(size: 80, color: Colors.cyanAccent),
                PulsingWidget(
                  child: Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.surface,
                      border: Border.all(color: Colors.cyanAccent.withValues(alpha: 0.4), width: 2),
                      boxShadow: [BoxShadow(color: Colors.cyanAccent.withValues(alpha: 0.3), blurRadius: 20)],
                    ),
                    child: Icon(Icons.smartphone, size: 22, color: Colors.cyanAccent),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // MHz badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.cyanAccent.withValues(alpha: 0.08),
              border: Border.all(color: Colors.cyanAccent.withValues(alpha: 0.2)),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.cyanAccent)),
                const SizedBox(width: 6),
                Text('13.56 MHz COUPLING DECLARED',
                  style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, color: Colors.cyanAccent)),
              ],
            ),
          ),
          const SizedBox(height: 12),

          Text(
            dp.nfcTargetStatus == 'PACKED' ? 'Securing RFID Seal' : 'Verifying Handover',
            style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 2),
          ),
          const SizedBox(height: 6),
          Text(dp.nfcStatusText,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 10, color: AppColors.textMuted, height: 1.4)),

          // Telemetry logs
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.5),
              border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _TelemetryRow(label: 'TX COUPLING STATUS:', value: 'CONNECTING', color: Colors.cyanAccent),
                _TelemetryRow(label: 'SECURE LEDGER:', value: 'SYNC ACTIVE', color: AppColors.teal),
                _TelemetryRow(label: 'SIGNING CRYPTO HASH...', value: '300ms', color: AppColors.textMuted),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TelemetryRow extends StatelessWidget {
  final String label, value;
  final Color color;
  const _TelemetryRow({required this.label, required this.value, required this.color});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, color: color.withValues(alpha: 0.7))),
          Text(value, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: FontWeight.w700, color: color.withValues(alpha: 0.7))),
        ],
      ),
    );
  }
}

class _CheckBadge extends StatelessWidget {
  final String label;
  final bool passed;
  const _CheckBadge({required this.label, required this.passed});
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: passed ? AppColors.teal.withValues(alpha: 0.08) : AppColors.surface,
          border: Border.all(color: passed ? AppColors.teal.withValues(alpha: 0.3) : AppColors.borderSubtle),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Column(
          children: [
            Text(label, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: FontWeight.w700, color: passed ? AppColors.teal : AppColors.textMuted)),
            const SizedBox(height: 2),
            Text(passed ? 'PASS ✓' : 'PENDING',
              style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 8, color: passed ? AppColors.teal : AppColors.textMuted)),
          ],
        ),
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final String label;
  final IconData? icon;
  final Color color;
  final VoidCallback onTap;
  const _ActionBtn({required this.label, this.icon, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.15),
      borderRadius: BorderRadius.circular(4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(4),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
          decoration: BoxDecoration(
            border: Border.all(color: color.withValues(alpha: 0.3)),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(child: Text(label, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white))),
              if (icon != null) Icon(icon, size: 16, color: color),
            ],
          ),
        ),
      ),
    );
  }
}

class _Corner extends StatelessWidget {
  final bool top, left;
  const _Corner({required this.top, required this.left});
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 16, height: 16,
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(
            top: top ? const BorderSide(color: AppColors.orange, width: 2) : BorderSide.none,
            bottom: !top ? const BorderSide(color: AppColors.orange, width: 2) : BorderSide.none,
            left: left ? const BorderSide(color: AppColors.orange, width: 2) : BorderSide.none,
            right: !left ? const BorderSide(color: AppColors.orange, width: 2) : BorderSide.none,
          ),
        ),
      ),
    );
  }
}
