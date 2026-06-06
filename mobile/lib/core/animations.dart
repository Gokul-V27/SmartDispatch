import 'dart:math';
import 'package:flutter/material.dart';
import 'theme.dart';

/// Pulsing scale animation (for NFC center icon)
class PulsingWidget extends StatefulWidget {
  final Widget child;
  final double minScale;
  final double maxScale;
  final Duration duration;
  const PulsingWidget({
    super.key,
    required this.child,
    this.minScale = 0.92,
    this.maxScale = 1.08,
    this.duration = const Duration(milliseconds: 1200),
  });
  @override
  State<PulsingWidget> createState() => _PulsingWidgetState();
}

class _PulsingWidgetState extends State<PulsingWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: widget.duration)
      ..repeat(reverse: true);
    _scale = Tween(begin: widget.minScale, end: widget.maxScale)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scale,
      builder: (_, __) => Transform.scale(scale: _scale.value, child: widget.child),
    );
  }
}

/// Expanding radar ripple ring (for NFC handshake)
class RadarRipple extends StatefulWidget {
  final double size;
  final Color color;
  final Duration duration;
  final double delay; // 0.0–1.0 fraction of the duration
  const RadarRipple({
    super.key,
    this.size = 120,
    this.color = AppColors.teal,
    this.duration = const Duration(seconds: 2),
    this.delay = 0.0,
  });
  @override
  State<RadarRipple> createState() => _RadarRippleState();
}

class _RadarRippleState extends State<RadarRipple>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: widget.duration);
    Future.delayed(
      Duration(
          milliseconds:
              (widget.duration.inMilliseconds * widget.delay).round()),
      () {
        if (mounted) _ctrl.repeat();
      },
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        final t = _ctrl.value;
        final scale = 1.0 + t * 1.5;
        final opacity = (1.0 - t).clamp(0.0, 0.8);
        return Transform.scale(
          scale: scale,
          child: Container(
            width: widget.size,
            height: widget.size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                  color: widget.color.withValues(alpha: opacity * 0.4), width: 1.5),
              color: widget.color.withValues(alpha: opacity * 0.06),
            ),
          ),
        );
      },
    );
  }
}

/// Horizontal scan line that sweeps vertically (camera viewfinder)
class ScanLineAnimation extends StatefulWidget {
  final Color color;
  final double height;
  const ScanLineAnimation(
      {super.key, this.color = AppColors.orange, this.height = 180});
  @override
  State<ScanLineAnimation> createState() => _ScanLineAnimationState();
}

class _ScanLineAnimationState extends State<ScanLineAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _pos;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);
    _pos = Tween(begin: 0.0, end: 1.0)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      child: AnimatedBuilder(
        animation: _pos,
        builder: (_, __) => Stack(children: [
          Positioned(
            top: _pos.value * (widget.height - 3),
            left: 0,
            right: 0,
            child: Container(
              height: 2,
              decoration: BoxDecoration(
                color: widget.color,
                boxShadow: [
                  BoxShadow(
                    color: widget.color.withValues(alpha: 0.6),
                    blurRadius: 10,
                    spreadRadius: 3,
                  )
                ],
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

/// Rotating dashed circle border (antenna animation)
class RotatingDashedCircle extends StatefulWidget {
  final double size;
  final Color color;
  final Duration duration;
  const RotatingDashedCircle({
    super.key,
    this.size = 80,
    this.color = AppColors.teal,
    this.duration = const Duration(seconds: 15),
  });
  @override
  State<RotatingDashedCircle> createState() => _RotatingDashedCircleState();
}

class _RotatingDashedCircleState extends State<RotatingDashedCircle>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: widget.duration)
      ..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) => Transform.rotate(
        angle: _ctrl.value * 2 * pi,
        child: CustomPaint(
          size: Size(widget.size, widget.size),
          painter: _DashedCirclePainter(color: widget.color),
        ),
      ),
    );
  }
}

class _DashedCirclePainter extends CustomPainter {
  final Color color;
  _DashedCirclePainter({required this.color});
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 2;
    const dashCount = 24;
    const gapFraction = 0.3;
    final sweepAngle = (2 * pi / dashCount) * (1 - gapFraction);
    for (int i = 0; i < dashCount; i++) {
      final startAngle = (2 * pi / dashCount) * i;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Spinning ring with a single colored arc segment (like a loading spinner)
class SpinningRing extends StatefulWidget {
  final double size;
  final Color color;
  final Duration duration;
  const SpinningRing({
    super.key,
    this.size = 96,
    this.color = Colors.cyanAccent,
    this.duration = const Duration(milliseconds: 1200),
  });
  @override
  State<SpinningRing> createState() => _SpinningRingState();
}

class _SpinningRingState extends State<SpinningRing>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: widget.duration)
      ..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) => Transform.rotate(
        angle: _ctrl.value * 2 * pi,
        child: SizedBox(
          width: widget.size,
          height: widget.size,
          child: CustomPaint(
            painter: _ArcRingPainter(color: widget.color),
          ),
        ),
      ),
    );
  }
}

class _ArcRingPainter extends CustomPainter {
  final Color color;
  _ArcRingPainter({required this.color});
  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()
      ..color = color.withValues(alpha: 0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    final fgPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 2;
    canvas.drawCircle(center, radius, bgPaint);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      pi / 2,
      false,
      fgPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
