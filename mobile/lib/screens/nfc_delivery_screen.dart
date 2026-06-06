import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

/// Screen 09 — NFC Delivery Confirmation
/// Delivery person taps NFC on box at customer's door
/// → Generates OTP → Customer verifies → Delivery confirmed
class NfcDeliveryScreen extends StatefulWidget {
  const NfcDeliveryScreen({super.key});
  @override
  State<NfcDeliveryScreen> createState() => _NfcDeliveryScreenState();
}

class _NfcDeliveryScreenState extends State<NfcDeliveryScreen> with SingleTickerProviderStateMixin {
  String _status = 'scan'; // scan, otp_sent, verifying, delivered, error
  Map<String, dynamic>? _tapResult;
  String? _error;
  final _tagIdCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.85, end: 1.0).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
  }

  Future<void> _tapNfc() async {
    if (_tagIdCtrl.text.isEmpty) return;
    setState(() { _status = 'verifying'; _error = null; });
    HapticFeedback.mediumImpact();

    final api = context.read<ApiService>();
    final auth = context.read<AuthService>();

    final result = await api.nfcDeliveryTap(
      tagId: _tagIdCtrl.text.trim(),
      deliveryPersonId: auth.userId ?? '',
    );

    if (result != null) {
      setState(() { _status = 'otp_sent'; _tapResult = result; });
      HapticFeedback.heavyImpact();
      _pulseCtrl.stop();
    } else {
      setState(() { _status = 'error'; _error = 'NFC tag not found or already delivered'; });
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpCtrl.text.isEmpty || _otpCtrl.text.length != 6) return;
    setState(() { _status = 'verifying'; _error = null; });

    final api = context.read<ApiService>();
    final result = await api.nfcVerifyOtp(
      tagId: _tagIdCtrl.text.trim(),
      otp: _otpCtrl.text.trim(),
    );

    if (result != null && result['result'] == 'SUCCESS') {
      setState(() { _status = 'delivered'; _tapResult = result; });
      HapticFeedback.heavyImpact();
    } else {
      setState(() { _status = 'otp_sent'; _error = result?['error'] ?? 'Invalid OTP. Try again.'; });
    }
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _tagIdCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('DELIVERY'),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(border: Border.all(color: AppColors.teal), color: AppColors.teal.withValues(alpha: 0.1)),
            child: const Text('NFC VERIFY', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.teal, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Column(children: [
          // ── STEP 1: NFC Tap ──────────────────────────────────
          if (_status == 'scan' || _status == 'verifying' && _tapResult == null)
            Column(children: [
              ScaleTransition(
                scale: _pulseAnim,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(40),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.blue, width: 2, style: BorderStyle.solid),
                    color: AppColors.blue.withValues(alpha: 0.03),
                  ),
                  child: const Column(children: [
                    Icon(Icons.nfc, size: 64, color: AppColors.blue),
                    SizedBox(height: 12),
                    Text('TAP BOX NFC TAG', style: TextStyle(
                      fontFamily: 'JetBrains Mono', fontSize: 14, color: AppColors.blue,
                      fontWeight: FontWeight.w700, letterSpacing: 1)),
                    SizedBox(height: 4),
                    Text('Hold phone near the NFC tag on the package',
                      style: TextStyle(fontSize: 11, color: AppColors.textMuted), textAlign: TextAlign.center),
                  ]),
                ),
              ),
              const SizedBox(height: 12),
              // Tag ID input
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderSubtle)),
                child: TextField(
                  controller: _tagIdCtrl,
                  style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14),
                  decoration: const InputDecoration(
                    labelText: 'NFC TAG ID',
                    hintText: 'NFC-TAG-001',
                    prefixIcon: Icon(Icons.nfc, size: 18),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: _status == 'verifying' ? null : _tapNfc,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.blue),
                icon: Icon(_status == 'verifying' ? Icons.hourglass_top : Icons.nfc, size: 18),
                label: Text(_status == 'verifying' ? 'READING NFC...' : 'TAP NFC — START DELIVERY'),
              ),
            ]),

          // ── STEP 2: OTP Generated → Ask Customer ─────────────
          if (_status == 'otp_sent' && _tapResult != null)
            Column(children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.blue.withValues(alpha: 0.1),
                  border: Border.all(color: AppColors.blue),
                ),
                child: Column(children: [
                  const Icon(Icons.mail_outline, size: 40, color: AppColors.blue),
                  const SizedBox(height: 8),
                  const Text('OTP SENT TO CUSTOMER', style: TextStyle(
                    fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.blue, letterSpacing: 1)),
                  const SizedBox(height: 8),
                  Text(_tapResult!['customerName'] ?? 'Customer', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  Text(_tapResult!['orderNumber'] ?? '', style: const TextStyle(
                    fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  // Demo: Show OTP (in production, only customer sees this)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.amber.withValues(alpha: 0.1),
                      border: Border.all(color: AppColors.amber),
                    ),
                    child: Column(children: [
                      const Text('DEMO MODE — OTP', style: TextStyle(
                        fontFamily: 'JetBrains Mono', fontSize: 8, color: AppColors.amber)),
                      Text(_tapResult!['otp'] ?? '------', style: const TextStyle(
                        fontFamily: 'JetBrains Mono', fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.amber, letterSpacing: 8)),
                      const Text('(In production, only customer sees this)', style: TextStyle(
                        fontSize: 8, color: AppColors.textMuted)),
                    ]),
                  ),
                ]),
              ),
              const SizedBox(height: 16),

              // OTP input
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderSubtle)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('ENTER CUSTOMER OTP', style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _otpCtrl,
                    maxLength: 6,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: 8),
                    decoration: const InputDecoration(
                      hintText: '● ● ● ● ● ●',
                      counterText: '',
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text('Ask the customer for the 6-digit OTP from their app',
                    style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                ]),
              ),
              const SizedBox(height: 12),

              ElevatedButton.icon(
                onPressed: _verifyOtp,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                icon: const Icon(Icons.check, size: 18),
                label: const Text('VERIFY OTP — CONFIRM DELIVERY'),
              ),
            ]),

          // ── STEP 3: Delivered ✓ ──────────────────────────────
          if (_status == 'delivered')
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppColors.teal.withValues(alpha: 0.1),
                border: Border.all(color: AppColors.teal, width: 2),
              ),
              child: Column(children: [
                const Icon(Icons.check_circle, size: 72, color: AppColors.teal),
                const SizedBox(height: 16),
                const Text('DELIVERED ✓', style: TextStyle(
                  fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.teal, letterSpacing: 3)),
                const SizedBox(height: 8),
                Text(_tapResult?['orderNumber'] ?? '', style: const TextStyle(
                  fontFamily: 'JetBrains Mono', fontSize: 14, color: AppColors.textSecondary)),
                const SizedBox(height: 4),
                Text('Delivered at: ${_tapResult?['deliveredAt'] ?? ''}', style: const TextStyle(
                  fontSize: 11, color: AppColors.textMuted)),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.teal.withValues(alpha: 0.1),
                    border: Border.all(color: AppColors.teal.withValues(alpha: 0.3)),
                  ),
                  child: const Text('✓ Customer notified: Package delivered!',
                    style: TextStyle(fontSize: 12, color: AppColors.teal, fontWeight: FontWeight.w600)),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (r) => false),
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                  icon: const Icon(Icons.home, size: 18),
                  label: const Text('BACK TO DASHBOARD'),
                ),
              ]),
            ),

          // ── Error ──────────────────────────────────────────
          if (_error != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.red.withValues(alpha: 0.1),
                border: const Border(left: BorderSide(color: AppColors.red, width: 3)),
              ),
              child: Text(_error!, style: const TextStyle(color: AppColors.red, fontFamily: 'JetBrains Mono', fontSize: 11)),
            ),
          ],
        ]),
      ),
    );
  }
}
