import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../services/dispatch_provider.dart';

/// Screen 01 — Worker Login (PIN Pad)
/// Matches the React emulator's gloves-friendly touchscreen PIN pad
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String _pin = '';
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Load workers from backend
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DispatchProvider>().loadWorkers();
    });
  }

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    final dp = context.read<DispatchProvider>();

    // Use email login to authenticate with the packer credentials
    // The workers list gives us the worker ID, but the backend auth uses email
    // We'll use email login with the default packer credentials
    final success = await dp.loginWithEmail('ravi@smartdispatch.com', 'packer123');

    setState(() { _loading = false; });
    if (success && mounted) {
      // Load orders after login
      await dp.loadOrders();
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/dashboard');
      }
    } else {
      setState(() { _error = 'Connection failed. Check backend.'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // App icon
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  color: AppColors.orange.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.inventory_2_outlined, size: 28, color: AppColors.orange),
              ),
              const SizedBox(height: 12),

              // SMART DISPATCH branding
              RichText(text: const TextSpan(children: [
                TextSpan(text: 'SMART', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
                TextSpan(text: 'DISPATCH', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.orange)),
              ])),
              const SizedBox(height: 4),
              Text('WORKER PORTAL', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted, letterSpacing: 4)),
              const SizedBox(height: 6),
              Text('Gloves-friendly touchscreen entry credentials.',
                style: TextStyle(fontSize: 10, color: AppColors.textMuted),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),

              // Worker ID selector
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('SELECT IDENTITY',
                      style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 1)),
                    const SizedBox(height: 4),
                    Consumer<DispatchProvider>(
                      builder: (ctx, dp, _) {
                        return Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            border: Border.all(color: AppColors.borderVisible),
                          ),
                          child: dp.workers.isEmpty
                            ? Text('Loading workers...', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textMuted))
                            : Text(
                                dp.workers.map((w) => '${w.name} (${w.workerId})').first,
                                style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: Colors.white),
                              ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Error
              if (_error != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: AppColors.red.withValues(alpha: 0.1),
                    border: const Border(left: BorderSide(color: AppColors.red, width: 3)),
                  ),
                  child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 11, fontFamily: 'JetBrains Mono')),
                ),

              // PIN display
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.surface.withValues(alpha: 0.8),
                  border: Border.all(color: AppColors.borderVisible),
                ),
                child: Center(
                  child: _pin.isEmpty
                    ? Text('Enter Any 4-Digit PIN', style: TextStyle(fontSize: 12, color: AppColors.textMuted))
                    : Text(
                        _pin.split('').map((_) => '•').join(' '),
                        style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 8),
                      ),
                ),
              ),
              const SizedBox(height: 8),

              // Number grid
              SizedBox(
                width: 260,
                child: GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 3,
                  mainAxisSpacing: 6,
                  crossAxisSpacing: 6,
                  childAspectRatio: 1.6,
                  children: [
                    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => _numButton('$n', () {
                      if (_pin.length < 4) setState(() => _pin += '$n');
                    })),
                    _actionButton('CLR', AppColors.red.withValues(alpha: 0.15), AppColors.red, () {
                      setState(() => _pin = '');
                    }),
                    _numButton('0', () {
                      if (_pin.length < 4) setState(() => _pin += '0');
                    }),
                    _actionButton('OK', AppColors.teal.withValues(alpha: 0.15), AppColors.teal, _loading ? null : _login),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Footer
              Text('Works offline · JWT cached 12h', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _numButton(String label, VoidCallback onTap) {
    return Material(
      color: AppColors.surface,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.borderVisible),
          ),
          alignment: Alignment.center,
          child: Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
        ),
      ),
    );
  }

  Widget _actionButton(String label, Color bg, Color fg, VoidCallback? onTap) {
    return Material(
      color: bg,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: fg.withValues(alpha: 0.4)),
          ),
          alignment: Alignment.center,
          child: Text(label, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: FontWeight.w700, color: fg)),
        ),
      ),
    );
  }
}
