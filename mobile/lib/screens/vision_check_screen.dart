import 'package:flutter/material.dart';
import '../core/theme.dart';

class VisionCheckScreen extends StatefulWidget {
  const VisionCheckScreen({super.key});

  @override
  State<VisionCheckScreen> createState() => _VisionCheckScreenState();
}

class _VisionCheckScreenState extends State<VisionCheckScreen> {
  bool _analyzing = true;
  bool _anomalyDetected = false;

  @override
  void initState() {
    super.initState();
    _simulateAnalysis();
  }

  void _simulateAnalysis() {
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _analyzing = false;
          _anomalyDetected = true; // Spec shows a red anomaly for demonstration
        });
      }
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
        title: const Text('AI Vision Check'),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.purple.withValues(alpha: 0.1),
              border: Border.all(color: AppColors.purple.withValues(alpha: 0.3)),
            ),
            child: const Text(
              'LAYER 3',
              style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.purple),
            ),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Camera Area Mock
            Container(
              height: 180,
              decoration: BoxDecoration(
                color: Colors.black,
                border: Border.all(color: AppColors.purple, width: 2),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.camera_alt, color: AppColors.textSecondary, size: 48),
                      const SizedBox(height: 8),
                      Text(
                        _analyzing ? 'ANALYZING...' : 'PHOTO TAKEN',
                        style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.purple),
                      ),
                    ],
                  ),
                  if (_analyzing)
                    const Positioned.fill(
                      child: Align(
                        alignment: Alignment.bottomCenter,
                        child: LinearProgressIndicator(color: AppColors.purple, backgroundColor: Colors.transparent),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // AI Detection Results
            if (!_analyzing) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.purple.withValues(alpha: 0.1),
                  border: Border.all(color: AppColors.purple.withValues(alpha: 0.4)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('AI DETECTED (5 objects)', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.purple)),
                    const SizedBox(height: 8),
                    _buildDetectionRow('Rice bag (white, 5kg)', '94%', true),
                    _buildDetectionRow('Dal packet (yellow)', '91%', true),
                    _buildDetectionRow('Oil bottle (1L)', '88%', true),
                    _buildDetectionRow('Unknown item detected', '71%', false),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Alert
              if (_anomalyDetected)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.red.withValues(alpha: 0.1),
                    border: const Border(left: BorderSide(color: AppColors.red, width: 3)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.warning, color: AppColors.red, size: 16),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '⚠ Unrecognised object in box — supervisor review',
                          style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.red),
                        ),
                      ),
                    ],
                  ),
                ),
              
              const Spacer(),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() {
                          _analyzing = true;
                          _anomalyDetected = false;
                        });
                        _simulateAnalysis();
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textPrimary,
                        side: const BorderSide(color: AppColors.borderVisible),
                      ),
                      child: const Text('RETAKE'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pushNamed(context, '/nfc-seal'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _anomalyDetected ? AppColors.purple : AppColors.teal,
                      ),
                      child: Text(_anomalyDetected ? 'SUPERVISOR PIN' : 'PROCEED TO NFC'),
                    ),
                  ),
                ],
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildDetectionRow(String item, String confidence, bool success) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 14, height: 14,
            decoration: BoxDecoration(
              color: success ? AppColors.teal : AppColors.red,
              borderRadius: BorderRadius.circular(2),
            ),
            child: Icon(success ? Icons.check : Icons.close, size: 10, color: success ? Colors.black : Colors.white),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              item,
              style: TextStyle(fontSize: 12, color: success ? AppColors.textPrimary : AppColors.red),
            ),
          ),
          Text(
            confidence,
            style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: success ? AppColors.textMuted : AppColors.red),
          ),
        ],
      ),
    );
  }
}
