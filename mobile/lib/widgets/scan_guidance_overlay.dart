import 'dart:async';
import 'package:flutter/material.dart';
import '../core/theme.dart';

/// Overlay widget shown inside camera viewport during active scanning.
/// Rotates tips every 3s, shows elapsed time + reason after 8s of scanning.
class ScanGuidanceOverlay extends StatefulWidget {
  final bool isScanning;
  final List<String> tips;
  final Color accentColor;

  const ScanGuidanceOverlay({
    super.key,
    required this.isScanning,
    required this.tips,
    this.accentColor = AppColors.orange,
  });

  @override
  State<ScanGuidanceOverlay> createState() => _ScanGuidanceOverlayState();
}

class _ScanGuidanceOverlayState extends State<ScanGuidanceOverlay>
    with SingleTickerProviderStateMixin {
  int _tipIndex = 0;
  int _elapsedSeconds = 0;
  Timer? _tipTimer;
  Timer? _clockTimer;
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeIn));
    if (widget.isScanning) _startTimers();
  }

  @override
  void didUpdateWidget(ScanGuidanceOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isScanning && !oldWidget.isScanning) {
      _elapsedSeconds = 0;
      _tipIndex = 0;
      _startTimers();
    } else if (!widget.isScanning && oldWidget.isScanning) {
      _stopTimers();
    }
  }

  void _startTimers() {
    _fadeCtrl.forward();
    _tipTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (mounted && widget.tips.isNotEmpty) {
        _fadeCtrl.reverse().then((_) {
          if (mounted) {
            setState(() => _tipIndex = (_tipIndex + 1) % widget.tips.length);
            _fadeCtrl.forward();
          }
        });
      }
    });
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _elapsedSeconds++);
    });
  }

  void _stopTimers() {
    _tipTimer?.cancel();
    _clockTimer?.cancel();
    _fadeCtrl.reverse();
  }

  @override
  void dispose() {
    _tipTimer?.cancel();
    _clockTimer?.cancel();
    _fadeCtrl.dispose();
    super.dispose();
  }

  String _getEtaHint() {
    if (_elapsedSeconds < 12) return 'Try adjusting the angle';
    if (_elapsedSeconds < 20) return 'Move to a brighter area';
    if (_elapsedSeconds < 30) return 'Clean the camera lens and retry';
    return 'Tap RETRY to try again manually';
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isScanning || widget.tips.isEmpty) return const SizedBox.shrink();

    final tip = widget.tips.isNotEmpty ? widget.tips[_tipIndex % widget.tips.length] : '';
    final showEta = _elapsedSeconds >= 8;

    return Positioned(
      bottom: 8, left: 8, right: 8,
      child: FadeTransition(
        opacity: _fadeAnim,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.75),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: widget.accentColor.withValues(alpha: 0.5), width: 1),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.tips_and_updates, color: widget.accentColor, size: 13),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      tip,
                      style: TextStyle(
                        fontSize: 11,
                        color: widget.accentColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              if (showEta) ...[
                const SizedBox(height: 5),
                Row(
                  children: [
                    const Icon(Icons.timer_outlined, color: AppColors.amber, size: 12),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        '${_elapsedSeconds}s elapsed — ${_getEtaHint()}',
                        style: const TextStyle(fontSize: 10, color: AppColors.amber),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
