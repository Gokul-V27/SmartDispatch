import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

/// Screen 07 — NFC Seal Confirmation
/// After all items are verified and label is printed,
/// the packer places the NFC tag on the box and taps their phone on it.
/// This confirms the box is sealed → customer gets notification.
class NfcSealScreen extends StatefulWidget {
  const NfcSealScreen({super.key});
  @override
  State<NfcSealScreen> createState() => _NfcSealScreenState();
}

class _NfcSealScreenState extends State<NfcSealScreen> with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _order;
  String _status = 'ready'; // ready, registering, tapping, sealed, error
  Map<String, dynamic>? _sealResult;
  String? _error;
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  // Simulated NFC tag ID (in real app, read from NFC hardware)
  final _tagIdCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.8, end: 1.0).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map<String, dynamic> && _order == null) {
      _order = args;
      // Auto-generate tag ID
      _tagIdCtrl.text = 'NFC-${_order!['orderNumber']?.replaceAll('ORD-', '') ?? 'TAG'}-001';
    }
  }

  Future<void> _registerAndSeal() async {
    if (_tagIdCtrl.text.isEmpty || _order == null) return;
    final api = context.read<ApiService>();
    final auth = context.read<AuthService>();

    // Step 1: Register the NFC tag
    setState(() { _status = 'registering'; _error = null; });
    final regResult = await api.nfcRegister(
      tagId: _tagIdCtrl.text.trim(),
      orderId: _order!['id'],
    );

    if (regResult == null) {
      setState(() { _status = 'error'; _error = 'Failed to register NFC tag'; });
      return;
    }

    // Step 2: Seal the box (simulates NFC tap)
    setState(() => _status = 'tapping');
    HapticFeedback.heavyImpact();

    // Small delay to simulate NFC read
    await Future.delayed(const Duration(milliseconds: 800));

    final sealResult = await api.nfcSeal(
      tagId: _tagIdCtrl.text.trim(),
      workerId: auth.userId ?? '',
    );

    if (sealResult != null) {
      setState(() { _status = 'sealed'; _sealResult = sealResult; });
      HapticFeedback.heavyImpact();
      _pulseCtrl.stop();
    } else {
      setState(() { _status = 'error'; _error = 'Failed to seal. Try again.'; });
    }
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _tagIdCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final accentColor = _status == 'sealed' ? AppColors.teal
        : _status == 'error' ? AppColors.red : AppColors.orange;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('NFC SEAL'),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(border: Border.all(color: AppColors.orange), color: AppColors.orange.withValues(alpha: 0.1)),
            child: const Text('STEP 4/5', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.orange, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Column(children: [
          // ── NFC Tap Area ─────────────────────────────────────
          if (_status != 'sealed')
            ScaleTransition(
              scale: _status == 'ready' || _status == 'tapping' ? _pulseAnim : const AlwaysStoppedAnimation(1.0),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(40),
                decoration: BoxDecoration(
                  border: Border.all(color: accentColor, width: 2, style: BorderStyle.solid),
                  color: accentColor.withValues(alpha: 0.03),
                ),
                child: Column(children: [
                  Icon(
                    _status == 'tapping' ? Icons.nfc : Icons.nfc,
                    size: 72, color: accentColor,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _status == 'tapping' ? 'READING NFC TAG...'
                      : _status == 'registering' ? 'REGISTERING TAG...'
                      : 'TAP PHONE ON BOX NFC',
                    style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14, color: accentColor,
                      fontWeight: FontWeight.w700, letterSpacing: 1),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _status == 'tapping' ? 'Hold steady...'
                      : 'Place your phone near the NFC tag on the box',
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                    textAlign: TextAlign.center,
                  ),
                ]),
              ),
            ),

          // ── Sealed success ───────────────────────────────────
          if (_status == 'sealed' && _sealResult != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.teal.withValues(alpha: 0.1),
                border: Border.all(color: AppColors.teal, width: 2),
              ),
              child: Column(children: [
                const Icon(Icons.verified, size: 64, color: AppColors.teal),
                const SizedBox(height: 12),
                const Text('BOX SEALED ✓', style: TextStyle(
                  fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.teal, letterSpacing: 2)),
                const SizedBox(height: 8),
                Text(_sealResult!['orderNumber'] ?? '', style: const TextStyle(
                  fontFamily: 'JetBrains Mono', fontSize: 14, color: AppColors.textSecondary)),
                const SizedBox(height: 12),
                // Status items
                _SealInfoRow(icon: Icons.person, label: 'Customer', value: _sealResult!['customerName'] ?? ''),
                _SealInfoRow(icon: Icons.notifications_active, label: 'Notification', value: 'Customer notified ✓', color: AppColors.teal),
                _SealInfoRow(icon: Icons.print, label: 'Label', value: 'Print ready ✓', color: AppColors.teal),
                _SealInfoRow(icon: Icons.access_time, label: 'Sealed at', value: _sealResult!['sealedAt'] ?? ''),
              ]),
            ),
          const SizedBox(height: 12),

          // ── Tag ID input (for testing / manual) ──────────────
          if (_status != 'sealed')
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderSubtle)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('NFC TAG ID', style: Theme.of(context).textTheme.labelSmall),
                const SizedBox(height: 8),
                TextField(
                  controller: _tagIdCtrl,
                  style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14),
                  decoration: const InputDecoration(
                    hintText: 'NFC-TAG-001',
                    labelText: 'TAG SERIAL',
                    prefixIcon: Icon(Icons.nfc, size: 18),
                  ),
                ),
                const SizedBox(height: 4),
                const Text('In production, this is auto-read from the NFC tag',
                  style: TextStyle(fontSize: 9, color: AppColors.textMuted)),
              ]),
            ),
          if (_status != 'sealed') const SizedBox(height: 12),

          // ── Error ─────────────────────────────────────────────
          if (_error != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.red.withValues(alpha: 0.1),
                border: const Border(left: BorderSide(color: AppColors.red, width: 3)),
              ),
              child: Text(_error!, style: const TextStyle(color: AppColors.red, fontFamily: 'JetBrains Mono', fontSize: 11)),
            ),
          if (_error != null) const SizedBox(height: 12),

          // ── Seal guide ────────────────────────────────────────
          if (_status == 'ready')
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: const Border(left: BorderSide(color: AppColors.orange, width: 3)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('SEAL PLACEMENT GUIDE', style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.orange)),
                const SizedBox(height: 8),
                // Box diagram
                Container(
                  width: double.infinity, height: 80,
                  decoration: BoxDecoration(border: Border.all(color: AppColors.borderVisible)),
                  child: Stack(children: [
                    Positioned(left: 0, right: 0, top: 35,
                      child: Container(height: 10, color: AppColors.orange.withValues(alpha: 0.3),
                        child: const Center(child: Text('PLACE NFC TAG HERE', style: TextStyle(
                          fontSize: 7, fontWeight: FontWeight.w700, color: AppColors.orange))))),
                    const Positioned(bottom: 4, right: 8,
                      child: Text('📦 BOX', style: TextStyle(fontSize: 9, color: AppColors.textMuted))),
                  ]),
                ),
                const SizedBox(height: 8),
                const Text('1. Place NFC tag on the box near the logo\n2. Tap your phone on the tag to confirm seal\n3. Customer will be automatically notified',
                  style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              ]),
            ),
          const SizedBox(height: 16),

          // ── Actions ─────────────────────────────────────────
          if (_status == 'ready')
            ElevatedButton.icon(
              onPressed: _registerAndSeal,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.orange),
              icon: const Icon(Icons.nfc, size: 18),
              label: const Text('TAP NFC — CONFIRM SEAL'),
            ),
          if (_status == 'sealed')
            Column(children: [
              ElevatedButton.icon(
                onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (r) => false),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                icon: const Icon(Icons.home, size: 18),
                label: const Text('BACK TO DASHBOARD'),
              ),
            ]),
        ]),
      ),
    );
  }
}

class _SealInfoRow extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color? color;
  const _SealInfoRow({required this.icon, required this.label, required this.value, this.color});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        Icon(icon, size: 16, color: color ?? AppColors.textMuted),
        const SizedBox(width: 8),
        SizedBox(width: 80, child: Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted))),
        Expanded(child: Text(value, style: TextStyle(
          fontFamily: 'JetBrains Mono', fontSize: 11, color: color ?? AppColors.textSecondary))),
      ]),
    );
  }
}
