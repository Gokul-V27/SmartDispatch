import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/mock_data.dart';

class OcrScanScreen extends StatefulWidget {
  const OcrScanScreen({super.key});

  @override
  State<OcrScanScreen> createState() => _OcrScanScreenState();
}

class _OcrScanScreenState extends State<OcrScanScreen> {
  bool _scanning = true;
  bool _matched = false;
  int _scannedCount = 0;
  final Set<int> _scannedItems = {};

  void _simulateScan() {
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _scanning = false;
          _matched = true;
          _scannedCount++;
          if (_scannedCount <= MockData.items.length) {
            _scannedItems.add(MockData.items[_scannedCount - 1].id);
          }
        });
      }
    });
  }

  @override
  void initState() {
    super.initState();
    _simulateScan();
  }

  @override
  Widget build(BuildContext context) {
    final totalItems = MockData.items.length;
    final allDone = _scannedCount >= totalItems;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Scan Product'),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: allDone ? AppColors.teal.withValues(alpha: 0.1) : AppColors.amber.withValues(alpha: 0.1),
              border: Border.all(color: allDone ? AppColors.teal : AppColors.amber.withValues(alpha: 0.3)),
            ),
            child: Text(
              '$_scannedCount/$totalItems',
              style: TextStyle(
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
                color: allDone ? AppColors.teal : AppColors.amber,
              ),
            ),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Viewfinder
            Container(
              height: 180,
              decoration: BoxDecoration(
                color: Colors.black,
                border: Border.all(color: _matched ? AppColors.teal : AppColors.orange, width: 2),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  const Text('📦', style: TextStyle(fontSize: 48)),
                  if (_scanning)
                    Positioned(
                      top: 90,
                      left: 0,
                      right: 0,
                      child: Container(
                        height: 2,
                        decoration: BoxDecoration(
                          color: AppColors.orange,
                          boxShadow: [BoxShadow(color: AppColors.orange.withValues(alpha: 0.6), blurRadius: 6)],
                        ),
                      ),
                    ),
                  // Corners
                  Positioned(top: 8, left: 8, child: _buildCorner(top: true, left: true)),
                  Positioned(top: 8, right: 8, child: _buildCorner(top: true, left: false)),
                  Positioned(bottom: 8, left: 8, child: _buildCorner(top: false, left: true)),
                  Positioned(bottom: 8, right: 8, child: _buildCorner(top: false, left: false)),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _scanning ? 'ALIGN LABEL — OCR ACTIVE' : (_matched ? 'MATCH SUCCESS' : 'SCAN FAILED'),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'JetBrains Mono',
                fontSize: 10,
                color: _scanning ? AppColors.orange : (_matched ? AppColors.teal : AppColors.red),
              ),
            ),
            const SizedBox(height: 16),

            // OCR Result overlay
            if (_matched && _scannedCount > 0)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.teal.withValues(alpha: 0.1),
                  border: Border.all(color: AppColors.teal.withValues(alpha: 0.4)),
                ),
                child: Column(
                  children: [
                    _buildResultRow('SKU DETECTED', 'SKU-9821-AA', AppColors.teal),
                    _buildResultRow('PRODUCT', MockData.items[_scannedCount - 1].name, AppColors.teal),
                    _buildResultRow('ORDER EXPECTS', MockData.items[_scannedCount - 1].name, AppColors.teal),
                    _buildResultRow('MATCH', '✓ PASS', AppColors.teal, bold: true),
                  ],
                ),
              ),
            
            const SizedBox(height: 24),
            Text('Order Checklist', style: Theme.of(context).textTheme.labelSmall),
            const SizedBox(height: 8),
            
            Expanded(
              child: ListView.builder(
                itemCount: totalItems,
                itemBuilder: (context, index) {
                  final item = MockData.items[index];
                  final isDone = _scannedItems.contains(item.id);
                  return Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: const BoxDecoration(
                      border: Border(bottom: BorderSide(color: AppColors.borderSubtle)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 16, height: 16,
                          decoration: BoxDecoration(
                            color: isDone ? AppColors.teal : Colors.transparent,
                            border: Border.all(color: isDone ? AppColors.teal : AppColors.borderVisible),
                          ),
                          child: isDone ? const Icon(Icons.check, size: 12, color: Colors.black) : null,
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Text(item.name, style: TextStyle(color: isDone ? AppColors.textPrimary : AppColors.textSecondary))),
                        Text('×1', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
                      ],
                    ),
                  );
                },
              ),
            ),

            if (allDone)
              ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/weight-check'),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                child: const Text('ALL SCANNED — WEIGH BOX'),
              )
            else
              ElevatedButton(
                onPressed: _scanning ? null : () {
                  setState(() {
                    _scanning = true;
                    _matched = false;
                  });
                  _simulateScan();
                },
                child: const Text('SCAN NEXT ITEM'),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCorner({required bool top, required bool left}) {
    return Container(
      width: 20, height: 20,
      decoration: BoxDecoration(
        border: Border(
          top: top ? BorderSide(color: _matched ? AppColors.teal : AppColors.orange, width: 2) : BorderSide.none,
          bottom: !top ? BorderSide(color: _matched ? AppColors.teal : AppColors.orange, width: 2) : BorderSide.none,
          left: left ? BorderSide(color: _matched ? AppColors.teal : AppColors.orange, width: 2) : BorderSide.none,
          right: !left ? BorderSide(color: _matched ? AppColors.teal : AppColors.orange, width: 2) : BorderSide.none,
        ),
      ),
    );
  }

  Widget _buildResultRow(String key, String value, Color color, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(key, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
          Text(value, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: color, fontWeight: bold ? FontWeight.w700 : FontWeight.normal)),
        ],
      ),
    );
  }
}
