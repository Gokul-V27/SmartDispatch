import 'package:flutter/material.dart';
import '../core/theme.dart';

class PackerGuideWidget extends StatelessWidget {
  final int stepNumber;
  final int totalSteps;
  final String stepTitle;
  final String instruction;
  final String expectedInfo;
  final bool isError;
  final String? errorText;

  const PackerGuideWidget({
    super.key,
    required this.stepNumber,
    required this.totalSteps,
    required this.stepTitle,
    required this.instruction,
    required this.expectedInfo,
    this.isError = false,
    this.errorText,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Step $stepNumber of $totalSteps',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.bold),
              ),
              Text(
                '${(stepNumber / totalSteps * 100).toInt()}%',
                style: const TextStyle(fontSize: 12, color: AppColors.blue, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Progress bar
          Container(
            height: 4,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.borderSubtle,
              borderRadius: BorderRadius.circular(2),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: stepNumber / totalSteps,
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.blue,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            stepTitle,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.bg,
              border: Border.all(color: AppColors.borderSubtle),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline, color: AppColors.blue, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        instruction,
                        style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        expectedInfo,
                        style: const TextStyle(
                          fontFamily: 'JetBrains Mono',
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (isError && errorText != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.red.withValues(alpha: 0.1),
                border: Border.all(color: AppColors.red.withValues(alpha: 0.3)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: AppColors.red, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      errorText!,
                      style: const TextStyle(fontSize: 13, color: AppColors.red),
                    ),
                  ),
                ],
              ),
            ),
          ]
        ],
      ),
    );
  }
}
