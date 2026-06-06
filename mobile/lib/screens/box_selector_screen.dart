import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/constants.dart';
import '../core/mock_data.dart';
import '../models/box_models.dart';

class BoxSelectorScreen extends StatefulWidget {
  const BoxSelectorScreen({super.key});

  @override
  State<BoxSelectorScreen> createState() => _BoxSelectorScreenState();
}

class _BoxSelectorScreenState extends State<BoxSelectorScreen> {
  BoxSize _selectedBox = MockData.boxes.firstWhere((b) => b.id == 'M');
  final Set<int> _checkedItems = {};

  List<Map<String, dynamic>> _getAlerts() {
    final box = _selectedBox;
    final items = MockData.items.where((it) => _checkedItems.contains(it.id)).toList();
    
    double totalW = box.tare + items.fold(0, (sum, it) => sum + it.weight);
    double totalVol = items.fold(0, (sum, it) => sum + it.volL);
    
    final fragile = items.where((i) => i.fragile || i.glass).toList();
    final heavy = items.where((i) => i.layer == 'bottom').toList();
    
    List<Map<String, dynamic>> alerts = [];

    if (totalW > box.maxKg) {
      alerts.add({
        'level': 'danger',
        'icon': Icons.dangerous,
        'title': 'Overweight — box will break',
        'body': '${totalW.toStringAsFixed(2)} kg is ${(totalW - box.maxKg).toStringAsFixed(2)} kg over the ${box.label} limit. Box base will split.',
      });
    } else if (totalW > box.maxKg * 0.9) {
      alerts.add({
        'level': 'warn',
        'icon': Icons.warning_amber,
        'title': 'Near weight limit',
        'body': '${totalW.toStringAsFixed(2)} kg — only ${(box.maxKg - totalW).toStringAsFixed(2)} kg left. Seams may crack.',
      });
    }

    if (totalVol > box.volL * 0.92) {
      alerts.add({
        'level': 'warn',
        'icon': Icons.inventory,
        'title': 'Box nearly full — lid may not close',
        'body': '${totalVol.toStringAsFixed(1)} L of items in a ${box.volL} L box.',
      });
    }

    if (fragile.isNotEmpty && heavy.isNotEmpty) {
      alerts.add({
        'level': 'danger',
        'icon': Icons.dangerous,
        'title': 'Fragile items will be crushed',
        'body': 'Heavy base items press down. Fragile must be on top.',
      });
    } else if (fragile.isNotEmpty) {
      alerts.add({
        'level': 'warn',
        'icon': Icons.warning_amber,
        'title': 'Place fragile items last',
        'body': 'Top layer only, nothing stacked above them.',
      });
    }

    if (items.any((i) => i.glass)) {
      alerts.add({
        'level': 'warn',
        'icon': Icons.wine_bar,
        'title': 'Glass — wrap before packing',
        'body': 'Bubble-wrap each glass jar individually.',
      });
    }

    if (items.any((i) => i.leaks)) {
      alerts.add({
        'level': 'warn',
        'icon': Icons.water_drop,
        'title': 'Liquid — keep upright',
        'body': 'Liquid items must be cap-side up.',
      });
    }

    if (box.id == 'XS' && items.any((i) => i.weight >= 2)) {
      alerts.add({
        'level': 'danger',
        'icon': Icons.dangerous,
        'title': 'Items too large for XS box',
        'body': 'Heavy grocery items need at least an S or M box.',
      });
    }

    if (_checkedItems.isNotEmpty && heavy.isEmpty && items.any((i) => i.layer == 'top')) {
      alerts.add({
        'level': 'info',
        'icon': Icons.info_outline,
        'title': 'No base layer item',
        'body': 'Add a heavy bottom-layer item first to stabilise the box.',
      });
    }

    if (alerts.isEmpty && _checkedItems.isNotEmpty) {
      alerts.add({
        'level': 'ok',
        'icon': Icons.check_circle,
        'title': 'Box is safe to seal',
        'body': 'All clear for ${box.label} box. Weight, volume and stacking order are fine.',
      });
    }

    return alerts;
  }

  BoxSize? _bestFitBox() {
    final items = MockData.items.where((it) => _checkedItems.contains(it.id)).toList();
    if (items.isEmpty) return null;
    
    double totalW = items.fold(0, (sum, it) => sum + it.weight);
    double totalVol = items.fold(0, (sum, it) => sum + it.volL);
    
    for (var b in MockData.boxes) {
      if ((totalW + b.tare) <= b.maxKg * 0.9 && totalVol <= b.volL * 0.88) {
        return b;
      }
    }
    return MockData.boxes.last;
  }

  Color _getAlertColor(String level) {
    switch (level) {
      case 'danger': return AppColors.red;
      case 'warn': return AppColors.amber;
      case 'info': return AppColors.blue;
      case 'ok': return AppColors.teal;
      default: return AppColors.textSecondary;
    }
  }

  Color _getAlertBg(String level) {
    return _getAlertColor(level).withValues(alpha: 0.1);
  }

  @override
  Widget build(BuildContext context) {
    final box = _selectedBox;
    final items = MockData.items.where((it) => _checkedItems.contains(it.id)).toList();
    
    double totalW = box.tare + items.fold(0, (sum, it) => sum + it.weight);
    double totalVol = items.fold(0, (sum, it) => sum + it.volL);
    int loadPct = ((totalW / box.maxKg) * 100).round();
    int volPct = ((totalVol / box.volL) * 100).round();
    
    final alerts = _getAlerts();
    final dangers = alerts.where((a) => a['level'] == 'danger').length;
    final warns = alerts.where((a) => a['level'] == 'warn').length;
    
    final bestFit = _bestFitBox();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Box Size Selector'),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
      ),
      body: Column(
        children: [
          // Box Selector Grid
          Container(
            padding: const EdgeInsets.all(12),
            color: AppColors.surface,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(children: [
                  Icon(Icons.inventory_2, size: 14, color: AppColors.textSecondary),
                  SizedBox(width: 6),
                  Text('Select box size', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                ]),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: MockData.boxes.map((b) => _buildBoxCard(b)).toList(),
                ),
              ],
            ),
          ),
          
          // Stats row
          Container(
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.borderVisible)),
            ),
            child: Row(
              children: [
                _buildStatCell('Capacity used', '$loadPct%', loadPct > 100 ? AppColors.red : (loadPct > 90 ? AppColors.amber : (items.isNotEmpty ? AppColors.teal : AppColors.textPrimary))),
                _buildStatCell('Total weight', '${totalW.toStringAsFixed(2)} kg', totalW > box.maxKg ? AppColors.red : (totalW > box.maxKg * 0.9 ? AppColors.amber : (items.isNotEmpty ? AppColors.teal : AppColors.textPrimary))),
                _buildStatCell('Alerts', '${alerts.where((a) => a['level'] != 'ok' && a['level'] != 'info').length}', dangers > 0 ? AppColors.red : (warns > 0 ? AppColors.amber : AppColors.teal)),
              ],
            ),
          ),

          // Main body
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left - Item List
                Expanded(
                  flex: 3,
                  child: Container(
                    decoration: const BoxDecoration(border: Border(right: BorderSide(color: AppColors.borderVisible))),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.borderVisible))),
                          child: const Row(children: [
                            Icon(Icons.checklist, size: 14, color: AppColors.textSecondary),
                            SizedBox(width: 6),
                            Text('Pack items — tap to add', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                          ]),
                        ),
                        Expanded(
                          child: ListView(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            children: MockData.items.map((item) {
                              final checked = _checkedItems.contains(item.id);
                              return InkWell(
                                onTap: () {
                                  setState(() {
                                    if (checked) _checkedItems.remove(item.id);
                                    else _checkedItems.add(item.id);
                                  });
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  color: checked ? AppColors.surface : Colors.transparent,
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 20, height: 20,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: checked ? AppColors.teal : Colors.transparent,
                                          border: Border.all(color: checked ? AppColors.teal : AppColors.borderVisible),
                                        ),
                                        child: checked ? const Icon(Icons.check, size: 12, color: Colors.black) : null,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(item.name, style: const TextStyle(fontSize: 12, color: AppColors.textPrimary)),
                                            Text(item.sub, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                                          ],
                                        ),
                                      ),
                                      Text('${item.weight.toStringAsFixed(2)} kg', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: AppColors.textSecondary)),
                                    ],
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                        
                        // Action row
                        if (bestFit != null && bestFit.id != box.id && items.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.all(8),
                            color: AppColors.surface,
                            child: Row(
                              children: [
                                const Icon(Icons.lightbulb, size: 14, color: AppColors.amber),
                                const SizedBox(width: 6),
                                Expanded(child: Text('Suggested: ${bestFit.label}', style: const TextStyle(fontSize: 11, color: AppColors.textPrimary))),
                                TextButton(
                                  onPressed: () => setState(() => _selectedBox = bestFit),
                                  style: TextButton.styleFrom(
                                    backgroundColor: AppColors.blue.withValues(alpha: 0.1),
                                    foregroundColor: AppColors.blue,
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                                    minimumSize: Size.zero,
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  child: const Text('Switch ↗', style: TextStyle(fontSize: 11)),
                                )
                              ],
                            ),
                          ),
                        Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              OutlinedButton(
                                onPressed: () => setState(() => _checkedItems.clear()),
                                child: const Text('Reset'),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: (items.isNotEmpty && dangers == 0) ? () {} : null,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: (items.isNotEmpty && dangers == 0) ? AppColors.teal : AppColors.surface,
                                    foregroundColor: (items.isNotEmpty && dangers == 0) ? Colors.black : AppColors.textMuted,
                                  ),
                                  child: Text((items.isNotEmpty && dangers == 0) ? 'Proceed ↗' : 'Resolve alerts'),
                                ),
                              ),
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                ),
                
                // Right - Alerts
                Expanded(
                  flex: 2,
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.borderVisible))),
                        child: const Row(children: [
                          Icon(Icons.warning, size: 14, color: AppColors.textSecondary),
                          SizedBox(width: 6),
                          Text('Packer alerts', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        ]),
                      ),
                      Expanded(
                        child: ListView(
                          padding: const EdgeInsets.all(8),
                          children: items.isEmpty
                            ? [_buildAlertCard('info', Icons.info_outline, 'Ready', 'Tap items to pack them. Alerts appear as you go.')]
                            : alerts.map((a) => _buildAlertCard(a['level'], a['icon'], a['title'], a['body'])).toList(),
                        ),
                      ),
                      // Box viz
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.borderVisible))),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('${box.label} box · ${box.maxKg} kg max', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                Text('$loadPct%', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Container(
                              height: 6, width: double.infinity,
                              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(3)),
                              child: FractionallySizedBox(
                                alignment: Alignment.centerLeft,
                                widthFactor: (loadPct / 100).clamp(0.0, 1.0),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: loadPct > 100 ? AppColors.red : (loadPct > 90 ? AppColors.amber : AppColors.teal),
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBoxCard(BoxSize b) {
    final active = _selectedBox.id == b.id;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedBox = b),
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 2),
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: active ? AppColors.blue.withValues(alpha: 0.1) : Colors.transparent,
            border: Border.all(color: active ? AppColors.blue : AppColors.borderSubtle),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Column(
            children: [
              Text(b.label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: active ? AppColors.blue : AppColors.textPrimary)),
              Text('${b.maxKg}kg', style: TextStyle(fontSize: 9, color: active ? AppColors.blue : AppColors.textSecondary)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCell(String lbl, String val, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        decoration: const BoxDecoration(border: Border(right: BorderSide(color: AppColors.borderVisible))),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(lbl, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
            const SizedBox(height: 2),
            Text(val, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildAlertCard(String level, IconData icon, String title, String body) {
    final color = _getAlertColor(level);
    final bg = _getAlertBg(level);
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: bg,
        border: Border(left: BorderSide(color: color, width: 3)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 6),
              Expanded(child: Text(title, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color))),
            ],
          ),
          const SizedBox(height: 4),
          Text(body, style: TextStyle(fontSize: 11, color: color.withValues(alpha: 0.8))),
        ],
      ),
    );
  }
}
