import 'package:flutter/material.dart';
import '../core/theme.dart';

class SealConfirmScreen extends StatefulWidget {
  const SealConfirmScreen({super.key});

  @override
  State<SealConfirmScreen> createState() => _SealConfirmScreenState();
}

class _SealConfirmScreenState extends State<SealConfirmScreen> {
  bool _photoTaken = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Apply Tamper Seal'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Apply physical tamper seal strip over the closed box lid, covering the NFC tag area.',
              style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),

            // Photo Area
            GestureDetector(
              onTap: () {
                setState(() => _photoTaken = true);
              },
              child: Container(
                height: 240,
                decoration: BoxDecoration(
                  color: Colors.black,
                  border: Border.all(color: _photoTaken ? AppColors.teal : AppColors.borderVisible, width: 2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: _photoTaken
                    ? Stack(
                        alignment: Alignment.center,
                        children: [
                          const Icon(Icons.image, size: 64, color: AppColors.teal),
                          Positioned(
                            bottom: 12,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              color: Colors.black54,
                              child: const Text(
                                'SHA-256: e3b0c44298fc1c149afbf4c8996fb924',
                                style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.teal),
                              ),
                            ),
                          )
                        ],
                      )
                    : const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.camera_alt, size: 48, color: AppColors.textMuted),
                          SizedBox(height: 12),
                          Text('TAP TO CAPTURE SEAL PHOTO', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 24),

            // Checklist
            _buildChecklistItem(1, 'Apply Physical Seal Strip', true),
            _buildChecklistItem(2, 'Capture Photo Evidence', _photoTaken),
            _buildChecklistItem(3, 'Confirm & Finalise', false),

            const Spacer(),

            Row(
              children: [
                if (_photoTaken)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _photoTaken = false),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textPrimary,
                        side: const BorderSide(color: AppColors.borderVisible),
                      ),
                      child: const Text('RETAKE'),
                    ),
                  ),
                if (_photoTaken) const SizedBox(width: 8),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _photoTaken ? () => Navigator.pushNamed(context, '/pack-complete') : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _photoTaken ? AppColors.teal : AppColors.surface,
                      foregroundColor: _photoTaken ? Colors.black : AppColors.textMuted,
                    ),
                    child: const Text('CONFIRM SEAL'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChecklistItem(int step, String text, bool isDone) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 24, height: 24,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isDone ? AppColors.teal : Colors.transparent,
              border: Border.all(color: isDone ? AppColors.teal : AppColors.borderVisible),
            ),
            child: Center(
              child: isDone
                  ? const Icon(Icons.check, size: 14, color: Colors.black)
                  : Text('$step', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textMuted)),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            text,
            style: TextStyle(
              fontSize: 14,
              color: isDone ? AppColors.textPrimary : AppColors.textMuted,
              fontWeight: isDone ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
