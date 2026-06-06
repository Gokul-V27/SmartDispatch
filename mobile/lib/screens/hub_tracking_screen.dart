import 'package:flutter/material.dart';
import '../core/theme.dart';

class HubTrackingScreen extends StatefulWidget {
  const HubTrackingScreen({super.key});

  @override
  State<HubTrackingScreen> createState() => _HubTrackingScreenState();
}

class _HubTrackingScreenState extends State<HubTrackingScreen> {
  bool _alertActive = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Hub Gate Tracking'),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.teal.withValues(alpha: 0.1),
              border: Border.all(color: AppColors.teal.withValues(alpha: 0.3)),
            ),
            child: const Text(
              'MQTT: CONNECTED',
              style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.teal),
            ),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Stats
            Row(
              children: [
                _buildStat('EXPECTED', '124', AppColors.blue),
                const SizedBox(width: 8),
                _buildStat('SCANNED', '123', AppColors.teal),
                const SizedBox(width: 8),
                _buildStat('MISSING', '1', AppColors.red),
              ],
            ),
            const SizedBox(height: 16),

            // Alert
            if (_alertActive)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.red.withValues(alpha: 0.1),
                  border: const Border(left: BorderSide(color: AppColors.red, width: 3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning, color: AppColors.red, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('MISSING BOX DETECTED', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.red)),
                          Text('Box ORD-9821-X not scanned at Gate 4. Expected in Truck TRK-88.', style: TextStyle(fontSize: 11, color: AppColors.red.withValues(alpha: 0.8))),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: AppColors.red, size: 16),
                      onPressed: () => setState(() => _alertActive = false),
                    )
                  ],
                ),
              ),
            
            const SizedBox(height: 16),
            const Text('Gate Log (Last 5 mins)', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textSecondary)),
            const SizedBox(height: 8),

            // Table Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              color: AppColors.surface,
              child: const Row(
                children: [
                  Expanded(flex: 2, child: Text('BOX ID', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted))),
                  Expanded(flex: 1, child: Text('GATE', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted))),
                  Expanded(flex: 2, child: Text('TIME', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted))),
                  Icon(Icons.check, size: 14, color: Colors.transparent),
                ],
              ),
            ),

            // Table Body
            Expanded(
              child: ListView(
                children: [
                  _buildLogRow('ORD-9825-A', 'G4', '14:32:01', true),
                  _buildLogRow('ORD-9824-B', 'G4', '14:31:45', true),
                  _buildLogRow('ORD-9821-X', 'G4', '--:--:--', false), // The missing one
                  _buildLogRow('ORD-9820-C', 'G4', '14:30:12', true),
                  _buildLogRow('ORD-9819-D', 'G4', '14:29:55', true),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(color: AppColors.borderVisible),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, color: AppColors.textMuted)),
          ],
        ),
      ),
    );
  }

  Widget _buildLogRow(String boxId, String gate, String time, bool isOk) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.borderSubtle)),
      ),
      child: Row(
        children: [
          Expanded(flex: 2, child: Text(boxId, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: isOk ? AppColors.textPrimary : AppColors.red))),
          Expanded(flex: 1, child: Text(gate, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textSecondary))),
          Expanded(flex: 2, child: Text(time, style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: isOk ? AppColors.textSecondary : AppColors.red))),
          Icon(isOk ? Icons.check_circle : Icons.warning, size: 14, color: isOk ? AppColors.teal : AppColors.red),
        ],
      ),
    );
  }
}
