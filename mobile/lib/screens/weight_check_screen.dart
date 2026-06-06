import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/mock_data.dart';

class WeightCheckScreen extends StatefulWidget {
  const WeightCheckScreen({super.key});

  @override
  State<WeightCheckScreen> createState() => _WeightCheckScreenState();
}

class _WeightCheckScreenState extends State<WeightCheckScreen> {
  bool _isWeighing = true;
  double _measuredWeight = 0.0;

  @override
  void initState() {
    super.initState();
    _simulateBleScale();
  }

  void _simulateBleScale() {
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isWeighing = false;
          // Simulate a weight very close to expected (MockData total weight + tare)
          // Box M tare is 0.70. Total items weight is ~22.36 (if all 8 are packed, but we'll mock a generic successful weight)
          _measuredWeight = 8.742; 
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    const double expectedWeight = 8.750;
    final double delta = _measuredWeight - expectedWeight;
    final int deltaGrams = (delta * 1000).round();
    
    final bool isPass = !_isWeighing && deltaGrams.abs() <= 50;
    final bool isWarn = !_isWeighing && deltaGrams.abs() > 50 && deltaGrams.abs() <= 150;
    final bool isFail = !_isWeighing && deltaGrams.abs() > 150;

    Color statusColor = AppColors.teal;
    String statusText = 'PASS';
    if (_isWeighing) {
      statusColor = AppColors.blue;
      statusText = 'WAIT';
    } else if (isWarn) {
      statusColor = AppColors.amber;
      statusText = 'WARN';
    } else if (isFail) {
      statusColor = AppColors.red;
      statusText = 'FAIL';
    }

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Weight Check'),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.teal.withValues(alpha: 0.1),
              border: Border.all(color: AppColors.teal.withValues(alpha: 0.3)),
            ),
            child: const Text(
              'BLE ●',
              style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.teal),
            ),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status Circle
            Center(
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: statusColor.withValues(alpha: 0.1),
                  border: Border.all(color: statusColor, width: 2),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (_isWeighing)
                      const CircularProgressIndicator(color: AppColors.blue)
                    else ...[
                      Text(
                        statusText,
                        style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: FontWeight.bold, color: statusColor),
                      ),
                      Text(
                        '${deltaGrams > 0 ? '+' : ''}${deltaGrams}g',
                        style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: statusColor),
                      ),
                    ]
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Metrics Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: Border.all(color: AppColors.borderVisible),
              ),
              child: Column(
                children: [
                  _buildMetricRow('MEASURED', _isWeighing ? '---' : '${_measuredWeight.toStringAsFixed(3)} kg', _isWeighing ? AppColors.textPrimary : statusColor),
                  const SizedBox(height: 12),
                  _buildMetricRow('EXPECTED', '${expectedWeight.toStringAsFixed(3)} kg', AppColors.blue),
                  const SizedBox(height: 12),
                  _buildMetricRow('DELTA', _isWeighing ? '---' : '${deltaGrams} g (within ±50g)', _isWeighing ? AppColors.textPrimary : statusColor, small: true),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Tolerance Bar
            Column(
              children: [
                Container(
                  height: 6,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: Stack(
                    children: [
                      // Tolerance band indicator
                      Positioned(
                        left: 0, right: 0, top: 0, bottom: 0,
                        child: FractionallySizedBox(
                          widthFactor: 0.2, // 20% width represents the ±50g band roughly
                          alignment: Alignment.center,
                          child: Container(color: AppColors.blue.withValues(alpha: 0.2)),
                        ),
                      ),
                      if (!_isWeighing)
                        FractionallySizedBox(
                          widthFactor: (0.5 + (deltaGrams / 500)).clamp(0.0, 1.0), // Maps delta to position
                          alignment: Alignment.centerLeft,
                          child: Container(
                            decoration: BoxDecoration(
                              color: statusColor,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('−50g', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
                    Text('TOLERANCE BAND', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
                    Text('+50g', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            Text('Manifest Weight Breakdown', style: Theme.of(context).textTheme.labelSmall),
            const SizedBox(height: 8),

            Expanded(
              child: ListView(
                children: [
                  _buildBreakdownRow('Box tare (M)', '0.700 kg'),
                  _buildBreakdownRow('Basmati Rice 5kg ×1', '5.020 kg'),
                  _buildBreakdownRow('Toor Dal 2kg ×2', '4.060 kg'),
                  _buildBreakdownRow('Coconut oil 1 L ×1', '0.920 kg'),
                ],
              ),
            ),

            if (!_isWeighing)
              ElevatedButton(
                onPressed: isPass ? () => Navigator.pushNamed(context, '/vision-check') : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: isPass ? AppColors.teal : AppColors.surface,
                  foregroundColor: isPass ? Colors.black : AppColors.textMuted,
                ),
                child: Text(isPass ? '▸ WEIGHT PASSED — NEXT' : 'RESOLVE TO CONTINUE'),
              )
          ],
        ),
      ),
    );
  }

  Widget _buildMetricRow(String label, String value, Color color, {bool small = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted, letterSpacing: 1)),
        Text(value, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: small ? 12 : 16, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }

  Widget _buildBreakdownRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: AppColors.textSecondary)),
          Text(value, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: AppColors.blue)),
        ],
      ),
    );
  }
}
