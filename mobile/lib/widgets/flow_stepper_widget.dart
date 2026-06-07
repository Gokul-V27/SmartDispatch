import 'package:flutter/material.dart';
import '../core/theme.dart';

class FlowStepperWidget extends StatelessWidget {
  final int currentStep; // 0 to 4
  final int totalSteps = 5;

  const FlowStepperWidget({
    super.key,
    required this.currentStep,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildStep(0, Icons.inventory_2, 'Box'),
          _buildDivider(0),
          _buildStep(1, Icons.qr_code_scanner, 'Scan'),
          _buildDivider(1),
          _buildStep(2, Icons.color_lens, 'Color'),
          _buildDivider(2),
          _buildStep(3, Icons.straighten, 'Size'),
          _buildDivider(3),
          _buildStep(4, Icons.check_circle_outline, 'Pack'),
        ],
      ),
    );
  }

  Widget _buildStep(int stepIndex, IconData icon, String label) {
    Color color;
    if (stepIndex < currentStep) {
      color = AppColors.teal; // Passed
    } else if (stepIndex == currentStep) {
      color = AppColors.blue; // Current
    } else {
      color = AppColors.textMuted; // Pending
    }

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: stepIndex == currentStep ? color.withValues(alpha: 0.1) : Colors.transparent,
            border: Border.all(color: color, width: stepIndex == currentStep ? 2 : 1),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 9,
            color: color,
            fontWeight: stepIndex == currentStep ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }

  Widget _buildDivider(int stepIndex) {
    Color color = stepIndex < currentStep ? AppColors.teal : AppColors.borderVisible;
    return Expanded(
      child: Container(
        height: 1,
        color: color,
        margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 14),
      ),
    );
  }
}
