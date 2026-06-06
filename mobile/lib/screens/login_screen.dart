import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../services/auth_service.dart';

/// Screen 01 — Worker Login
/// PIN + Email login with dark industrial theme
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController(text: 'ravi@smartdispatch.com');
  final _passCtrl = TextEditingController(text: 'packer123');
  final _workerIdCtrl = TextEditingController(text: 'WK-04219');
  final _pinCtrl = TextEditingController(text: '123456');
  bool _usePin = false;
  bool _loading = false;
  String? _error;

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    final auth = context.read<AuthService>();
    bool success;
    if (_usePin) {
      success = await auth.pinLogin(_workerIdCtrl.text, _pinCtrl.text);
    } else {
      success = await auth.login(_emailCtrl.text, _passCtrl.text);
    }
    setState(() { _loading = false; });
    if (success) {
      Navigator.pushReplacementNamed(context, '/dashboard');
    } else {
      setState(() { _error = 'Invalid credentials'; });
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
              // Logo
              const Icon(Icons.inventory_2, size: 56, color: AppColors.orange),
              const SizedBox(height: 12),
              RichText(text: const TextSpan(
                style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: FontWeight.w700),
                children: [
                  TextSpan(text: 'SMART', style: TextStyle(color: Colors.white)),
                  TextSpan(text: 'DISPATCH', style: TextStyle(color: AppColors.orange)),
                ],
              )),
              const SizedBox(height: 4),
              Text('PACKER TERMINAL', style: Theme.of(context).textTheme.labelSmall),
              const SizedBox(height: 32),

              // Toggle
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.borderVisible),
                ),
                child: Row(
                  children: [
                    Expanded(child: GestureDetector(
                      onTap: () => setState(() => _usePin = false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        color: !_usePin ? AppColors.orange.withValues(alpha: 0.15) : Colors.transparent,
                        child: Text('EMAIL LOGIN', textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: FontWeight.w700,
                            color: !_usePin ? AppColors.orange : AppColors.textMuted)),
                      ),
                    )),
                    Expanded(child: GestureDetector(
                      onTap: () => setState(() => _usePin = true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        color: _usePin ? AppColors.orange.withValues(alpha: 0.15) : Colors.transparent,
                        child: Text('PIN LOGIN', textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: FontWeight.w700,
                            color: _usePin ? AppColors.orange : AppColors.textMuted)),
                      ),
                    )),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Error
              if (_error != null) Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.red.withValues(alpha: 0.1),
                  border: const Border(left: BorderSide(color: AppColors.red, width: 3)),
                ),
                child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12, fontFamily: 'JetBrains Mono')),
              ),
              if (_error != null) const SizedBox(height: 12),

              // Fields
              if (!_usePin) ...[
                TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'EMAIL')),
                const SizedBox(height: 12),
                TextField(controller: _passCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'PASSWORD')),
              ] else ...[
                TextField(controller: _workerIdCtrl, decoration: const InputDecoration(labelText: 'WORKER ID', hintText: 'WK-XXXXX')),
                const SizedBox(height: 12),
                TextField(controller: _pinCtrl, obscureText: true, maxLength: 6, keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: '6-DIGIT PIN', counterText: '')),
              ],
              const SizedBox(height: 20),

              // Login button
              ElevatedButton(
                onPressed: _loading ? null : _login,
                child: _loading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Text('SIGN IN'),
              ),
              const SizedBox(height: 24),

              // Footer
              Text('Works offline · JWT cached 12h', style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}
