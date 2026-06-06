import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../core/theme.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

/// Screen 04 — AI Vision Verification
/// Worker takes a photo of the product → backend compares against admin's reference.
/// Uses 4 algorithms: Color Histogram, Perceptual Hash, Structural, Dominant Color.
/// Returns a similarity score and detailed breakdown.
class VisionCheckScreen extends StatefulWidget {
  const VisionCheckScreen({super.key});
  @override
  State<VisionCheckScreen> createState() => _VisionCheckScreenState();
}

class _VisionCheckScreenState extends State<VisionCheckScreen> {
  Map<String, dynamic>? _order;
  List<dynamic> _items = [];
  int _currentItemIndex = 0;

  String _status = 'ready'; // ready, capturing, analyzing, pass, warn, fail
  Map<String, dynamic>? _result;
  String? _capturedPath;
  String? _error;

  final _picker = ImagePicker();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map<String, dynamic> && _order == null) {
      _order = args;
      _items = List.from(args['items'] ?? []);
    }
  }

  Future<void> _capturePhoto() async {
    setState(() { _status = 'capturing'; _error = null; _result = null; });

    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 80,
        maxWidth: 1024,
        maxHeight: 1024,
      );

      if (photo == null) {
        setState(() => _status = 'ready');
        return;
      }

      _capturedPath = photo.path;
      setState(() => _status = 'analyzing');
      HapticFeedback.mediumImpact();

      // Send to backend for AI comparison
      final api = context.read<ApiService>();
      final auth = context.read<AuthService>();
      final item = _items[_currentItemIndex];

      final result = await api.visionCompareOrderItem(
        orderItemId: item['id'],
        workerId: auth.userId ?? '',
        filePath: photo.path,
      );

      if (result != null) {
        final r = result['result'] as String;
        setState(() {
          _result = result;
          _status = r == 'PASS' ? 'pass' : (r == 'WARN' ? 'warn' : 'fail');
        });
        HapticFeedback.heavyImpact();
      } else {
        setState(() { _status = 'fail'; _error = 'Backend comparison failed'; });
      }
    } catch (e) {
      setState(() { _status = 'ready'; _error = e.toString(); });
    }
  }

  /// Use gallery instead of camera (for testing on emulator)
  Future<void> _pickFromGallery() async {
    setState(() { _status = 'capturing'; _error = null; _result = null; });

    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 80,
        maxWidth: 1024,
      );

      if (photo == null) {
        setState(() => _status = 'ready');
        return;
      }

      _capturedPath = photo.path;
      setState(() => _status = 'analyzing');

      final api = context.read<ApiService>();
      final auth = context.read<AuthService>();
      final item = _items[_currentItemIndex];

      final result = await api.visionCompareOrderItem(
        orderItemId: item['id'],
        workerId: auth.userId ?? '',
        filePath: photo.path,
      );

      if (result != null) {
        final r = result['result'] as String;
        setState(() {
          _result = result;
          _status = r == 'PASS' ? 'pass' : (r == 'WARN' ? 'warn' : 'fail');
        });
      } else {
        setState(() { _status = 'fail'; _error = 'Comparison failed'; });
      }
    } catch (e) {
      setState(() { _status = 'ready'; _error = e.toString(); });
    }
  }

  void _nextItem() {
    if (_currentItemIndex < _items.length - 1) {
      setState(() {
        _currentItemIndex++;
        _status = 'ready';
        _result = null;
        _capturedPath = null;
        _error = null;
      });
    } else {
      Navigator.pushReplacementNamed(context, '/pack-complete', arguments: _order);
    }
  }

  Color get _accentColor => _status == 'pass' ? AppColors.teal
      : _status == 'warn' ? AppColors.amber
      : _status == 'fail' ? AppColors.red : AppColors.purple;

  @override
  Widget build(BuildContext context) {
    final currentItem = _items.isNotEmpty ? _items[_currentItemIndex] : null;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('AI VISION'),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(border: Border.all(color: AppColors.purple), color: AppColors.purple.withValues(alpha: 0.1)),
            child: Text('${_currentItemIndex + 1}/${_items.length}',
              style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: AppColors.purple)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Column(children: [
          // ── Camera viewfinder / captured image ───────────────
          Container(
            height: 220,
            width: double.infinity,
            decoration: BoxDecoration(
              border: Border.all(color: _accentColor, width: 2),
              color: AppColors.surface,
            ),
            child: _capturedPath != null
                ? Stack(children: [
                    Center(child: Image.file(File(_capturedPath!), fit: BoxFit.cover, width: double.infinity, height: 220)),
                    // Overlay result badge
                    if (_status == 'pass' || _status == 'warn' || _status == 'fail')
                      Positioned(top: 8, right: 8, child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: _accentColor, borderRadius: BorderRadius.circular(2)),
                        child: Text(
                          _status == 'pass' ? 'MATCH ✓' : _status == 'warn' ? 'PARTIAL' : 'NO MATCH ✗',
                          style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                      )),
                  ])
                : Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(
                      _status == 'analyzing' ? Icons.auto_awesome : Icons.photo_camera,
                      size: 56, color: _accentColor,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _status == 'analyzing' ? 'ANALYZING...' : 'TAKE PRODUCT PHOTO',
                      style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: _accentColor, letterSpacing: 1, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    const Text('Photo will be compared with admin reference',
                      style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                  ]),
          ),
          const SizedBox(height: 8),

          // ── Capture buttons ──────────────────────────────────
          if (_status == 'ready' || _status == 'fail' || _status == 'warn')
            Row(children: [
              Expanded(child: ElevatedButton.icon(
                onPressed: _capturePhoto,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.purple),
                icon: const Icon(Icons.photo_camera, size: 18),
                label: const Text('CAMERA'),
              )),
              const SizedBox(width: 8),
              Expanded(child: ElevatedButton.icon(
                onPressed: _pickFromGallery,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.blue),
                icon: const Icon(Icons.photo_library, size: 18),
                label: const Text('GALLERY'),
              )),
            ]),
          const SizedBox(height: 12),

          // ── Expected product ─────────────────────────────────
          if (currentItem != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                border: const Border(left: BorderSide(color: AppColors.purple, width: 3)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('EXPECTED PRODUCT', style: Theme.of(context).textTheme.labelSmall),
                const SizedBox(height: 6),
                Text(currentItem['productName'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(height: 4),
                _InfoChip('BRAND', currentItem['productBrand'] ?? ''),
                _InfoChip('COLOR', currentItem['productColor'] ?? '', color: AppColors.purple),
                _InfoChip('SKU', currentItem['productSku'] ?? ''),
              ]),
            ),
          const SizedBox(height: 12),

          // ── AI RESULT ────────────────────────────────────────
          if (_result != null) ...[
            // Overall score banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _accentColor.withValues(alpha: 0.1),
                border: Border.all(color: _accentColor, width: 2),
              ),
              child: Column(children: [
                Text('${_result!['confidence'] ?? 0}%',
                  style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 48, fontWeight: FontWeight.w700, color: _accentColor)),
                const SizedBox(height: 4),
                Text(
                  _status == 'pass' ? 'VISION MATCH' : _status == 'warn' ? 'PARTIAL MATCH' : 'VISION MISMATCH',
                  style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: FontWeight.w700, color: _accentColor, letterSpacing: 2)),
                const SizedBox(height: 4),
                Text(
                  _result!['mode'] == 'COLOR_ONLY'
                    ? 'Color analysis only (no reference image)'
                    : 'Full comparison with reference image',
                  style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
              ]),
            ),
            const SizedBox(height: 8),

            // Score breakdown (full comparison mode)
            if (_result!['mode'] == 'FULL_COMPARISON')
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderSubtle)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('ANALYSIS BREAKDOWN', style: Theme.of(context).textTheme.labelSmall),
                  const SizedBox(height: 10),
                  _ScoreBar('Color Histogram', (_result!['colorHistogramScore'] as num?)?.toDouble() ?? 0),
                  _ScoreBar('Perceptual Hash', (_result!['perceptualHashScore'] as num?)?.toDouble() ?? 0),
                  _ScoreBar('Structural Match', (_result!['structuralScore'] as num?)?.toDouble() ?? 0),
                  _ScoreBar('Dominant Color', (_result!['dominantColorScore'] as num?)?.toDouble() ?? 0),
                ]),
              ),
            const SizedBox(height: 8),

            // Dominant color comparison
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderSubtle)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('COLOR DETECTION', style: Theme.of(context).textTheme.labelSmall),
                const SizedBox(height: 8),
                Row(children: [
                  _ColorBox('EXPECTED', _result!['expectedColor'] ?? _result!['referenceDominantColor'] ?? 'N/A', AppColors.blue),
                  const SizedBox(width: 8),
                  const Icon(Icons.compare_arrows, size: 16, color: AppColors.textMuted),
                  const SizedBox(width: 8),
                  _ColorBox('DETECTED', _result!['detectedColor'] ?? _result!['capturedDominantColor'] ?? 'N/A', _accentColor),
                ]),
                if (_result!['colorMatch'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Row(children: [
                      Icon(_result!['colorMatch'] == true ? Icons.check_circle : Icons.cancel,
                        size: 16, color: _result!['colorMatch'] == true ? AppColors.teal : AppColors.red),
                      const SizedBox(width: 6),
                      Text(_result!['colorMatch'] == true ? 'Color matches expected' : 'Color does not match',
                        style: TextStyle(fontSize: 11, color: _result!['colorMatch'] == true ? AppColors.teal : AppColors.red, fontWeight: FontWeight.w600)),
                    ]),
                  ),
              ]),
            ),
            const SizedBox(height: 12),
          ],

          // ── Error ─────────────────────────────────────────────
          if (_error != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.red.withValues(alpha: 0.1),
                border: const Border(left: BorderSide(color: AppColors.red, width: 3)),
              ),
              child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 11, fontFamily: 'JetBrains Mono')),
            ),

          // ── Actions ──────────────────────────────────────────
          const SizedBox(height: 8),
          if (_status == 'pass')
            ElevatedButton.icon(
              onPressed: _nextItem,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
              icon: const Icon(Icons.arrow_forward, size: 18),
              label: Text(_currentItemIndex < _items.length - 1 ? 'NEXT ITEM' : 'ALL VERIFIED → COMPLETE'),
            ),
          if (_status == 'warn')
            Row(children: [
              Expanded(child: ElevatedButton.icon(
                onPressed: () => setState(() { _status = 'ready'; _result = null; _capturedPath = null; }),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.amber),
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('RETAKE'),
              )),
              const SizedBox(width: 8),
              Expanded(child: ElevatedButton.icon(
                onPressed: _nextItem,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                icon: const Icon(Icons.arrow_forward, size: 18),
                label: const Text('ACCEPT'),
              )),
            ]),
          if (_status == 'fail')
            ElevatedButton.icon(
              onPressed: () => setState(() { _status = 'ready'; _result = null; _capturedPath = null; _error = null; }),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.red),
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('RETAKE PHOTO'),
            ),
        ]),
      ),
    );
  }
}

// ── Helper Widgets ────────────────────────────────────────────

class _InfoChip extends StatelessWidget {
  final String label, value;
  final Color? color;
  const _InfoChip(this.label, this.value, {this.color});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(children: [
        SizedBox(width: 55, child: Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, color: AppColors.textMuted))),
        Text(value, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: color ?? AppColors.textSecondary)),
      ]),
    );
  }
}

class _ScoreBar extends StatelessWidget {
  final String label;
  final double score; // 0.0 - 1.0
  const _ScoreBar(this.label, this.score);
  @override
  Widget build(BuildContext context) {
    final color = score >= 0.7 ? AppColors.teal : score >= 0.5 ? AppColors.amber : AppColors.red;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary))),
          Text('${(score * 100).toInt()}%', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: FontWeight.w700, color: color)),
        ]),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(1),
          child: LinearProgressIndicator(
            value: score,
            backgroundColor: AppColors.elevated,
            color: color,
            minHeight: 6,
          ),
        ),
      ]),
    );
  }
}

class _ColorBox extends StatelessWidget {
  final String label, colorName;
  final Color accentColor;
  const _ColorBox(this.label, this.colorName, this.accentColor);
  @override
  Widget build(BuildContext context) {
    return Expanded(child: Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: accentColor.withValues(alpha: 0.05),
        border: Border.all(color: accentColor.withValues(alpha: 0.3)),
      ),
      child: Column(children: [
        Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 8, color: AppColors.textMuted)),
        const SizedBox(height: 4),
        Text(colorName, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: FontWeight.w700, color: accentColor)),
      ]),
    ));
  }
}
