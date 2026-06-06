import 'package:flutter/material.dart';
import '../core/theme.dart';

class NfcSealScreen extends StatefulWidget {
  const NfcSealScreen({super.key});

  @override
  State<NfcSealScreen> createState() => _NfcSealScreenState();
}

class _NfcSealScreenState extends State<NfcSealScreen> {
  int _currentStep = 0; // 0: Connect, 1: Write, 2: Lock, 3: Verify, 4: Done
  bool _isWriting = false;

  void _startNfcProcess() {
    setState(() => _isWriting = true);
    
    // Simulate the 4 steps
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) setState(() => _currentStep = 1);
      
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) setState(() => _currentStep = 2);
        
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) setState(() => _currentStep = 3);
          
          Future.delayed(const Duration(seconds: 1), () {
            if (mounted) {
              setState(() {
                _currentStep = 4;
                _isWriting = false;
              });
            }
          });
        });
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('NFC Tag Write'),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.blue.withValues(alpha: 0.1),
              border: Border.all(color: AppColors.blue.withValues(alpha: 0.3)),
            ),
            child: const Text(
              'NDEF/RAW',
              style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.blue),
            ),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Scan Area
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: Border.all(
                  color: _isWriting ? AppColors.blue : (_currentStep == 4 ? AppColors.teal : AppColors.borderVisible),
                  width: 2,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Icon(
                    _currentStep == 4 ? Icons.check_circle : Icons.nfc,
                    size: 64,
                    color: _currentStep == 4 ? AppColors.teal : AppColors.blue,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _currentStep == 4 
                        ? 'NFC WRITE COMPLETE'
                        : (_isWriting ? 'KEEP PHONE NEAR BOX...' : 'TAP PHONE TO SMART BOX NFC TAG'),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'JetBrains Mono',
                      fontSize: 12,
                      color: _currentStep == 4 ? AppColors.teal : AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Step Visualization
            _buildStepRow('1. CONNECT', 'ISO 15693 / NTAG 424', 0),
            _buildStepRow('2. WRITE', 'Manifest Hash & Routing Data', 1),
            _buildStepRow('3. LOCK', 'AES-128 Sector Permissions', 2),
            _buildStepRow('4. VERIFY', 'Read-back verification', 3),
            
            const SizedBox(height: 24),

            // Tag Data
            if (_currentStep == 4) ...[
              const Text('Tag Data Written', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.blue.withValues(alpha: 0.1),
                  border: Border.all(color: AppColors.blue.withValues(alpha: 0.3)),
                ),
                child: const Column(
                  children: [
                    _DataRow(label: 'TAG UID', value: '04:8F:A1:3B:92:1C'),
                    SizedBox(height: 4),
                    _DataRow(label: 'MANIFEST HASH', value: 'a8f3...b9c1'),
                    SizedBox(height: 4),
                    _DataRow(label: 'SECTORS', value: 'LOCKED (AES-128)'),
                  ],
                ),
              ),
            ],

            const Spacer(),

            // Actions
            if (_currentStep == 4)
              ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/seal-confirm'),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                child: const Text('PROCEED TO SEAL BOX'),
              )
            else
              ElevatedButton(
                onPressed: _isWriting ? null : _startNfcProcess,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.blue),
                child: Text(_isWriting ? 'WRITING...' : 'START NFC WRITE'),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepRow(String title, String subtitle, int stepIndex) {
    Color color;
    IconData icon;
    
    if (_currentStep > stepIndex) {
      color = AppColors.teal;
      icon = Icons.check_circle;
    } else if (_currentStep == stepIndex && _isWriting) {
      color = AppColors.blue;
      icon = Icons.sync;
    } else {
      color = AppColors.textMuted;
      icon = Icons.radio_button_unchecked;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: FontWeight.bold, color: color)),
              Text(subtitle, style: TextStyle(fontSize: 10, color: AppColors.textSecondary)),
            ],
          ),
        ],
      ),
    );
  }
}

class _DataRow extends StatelessWidget {
  final String label;
  final String value;
  const _DataRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textSecondary)),
        Text(value, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.blue)),
      ],
    );
  }
}
