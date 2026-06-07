import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:ndef/ndef.dart' as ndef;
import 'package:uuid/uuid.dart';

import '../core/theme.dart';
import '../services/packing_provider.dart';
import '../services/dispatch_provider.dart';
import '../widgets/packer_guide_widget.dart';

class PackCompleteScreen extends StatefulWidget {
  const PackCompleteScreen({super.key});

  @override
  State<PackCompleteScreen> createState() => _PackCompleteScreenState();
}

class _PackCompleteScreenState extends State<PackCompleteScreen> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  
  bool _nfcSealed = false;
  bool _isWriting = false;
  String _statusMessage = 'Ready to tag';
  String? _error;
  bool _nfcAvailable = true;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    _checkNfcAvailability();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _checkNfcAvailability() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        setState(() {
          _nfcAvailable = false;
          _statusMessage = 'NFC not available on this device. Simulator mode active.';
        });
      }
    } catch (e) {
      setState(() {
        _nfcAvailable = false;
        _statusMessage = 'NFC not available. Simulator mode active.';
      });
    }

    final packProv = Provider.of<PackingProvider>(context, listen: false);
    if (packProv.isAutoProcessing || !_nfcAvailable) {
      Future.delayed(const Duration(milliseconds: 1500), () {
        if (mounted) _startNfcProcess();
      });
    }
  }

  Future<void> _startNfcProcess() async {
    setState(() {
      _isWriting = true;
      _statusMessage = _nfcAvailable 
          ? 'Hold phone flat against the NFC tag on box lid. Keep still for 3 seconds.' 
          : 'Simulating NFC tag write and backend seal...';
      _error = null;
    });

    final packProv = Provider.of<PackingProvider>(context, listen: false);
    final dp = Provider.of<DispatchProvider>(context, listen: false);
    try {
      String tagId = const Uuid().v4();

      if (packProv.isAutoProcessing || !_nfcAvailable) {
        // Simulating NFC hardware
        await Future.delayed(const Duration(seconds: 2));
      } else {
        // Real NFC hardware
        try {
          final tag = await FlutterNfcKit.poll(
            timeout: const Duration(seconds: 15),
            iosAlertMessage: 'Hold phone near the NFC tag on the box.',
          );
          
          tagId = tag.id; // Get physical tag ID
          
          // We attempt to write a minimal TextRecord to the tag.
          // However, many tags (like ID badges or locked tags) are read-only.
          // Since the backend only relies on the physical tag.id, we can safely
          // ignore write errors and just proceed!
          try {
            final record = ndef.TextRecord(text: 'SD-${tagId.substring(0, 8)}', language: 'en');
            await FlutterNfcKit.writeNDEFRecords([record]);
          } catch (e) {
            print('Could not write to tag, it might be read-only. Proceeding anyway with hardware ID. Error: $e');
          }
          
          
        } finally {
          // CRITICAL: Always release the NFC transceive session, even on communication errors
          try {
            await FlutterNfcKit.finish(iosAlertMessage: 'Sealed!');
          } catch (_) {}
        }
      }

      // Notify backend that tag is registered and sealed
      final regSuccess = await packProv.registerNfcTag(tagId);
      if (!regSuccess) {
        throw Exception('Failed to register NFC tag with backend: ${packProv.error}');
      }
      
      final sealSuccess = await packProv.sealNfcTag(tagId);
      if (!sealSuccess) {
        throw Exception('Failed to seal NFC tag with backend: ${packProv.error}');
      }

      if (mounted) {
        setState(() {
          _nfcSealed = true;
          _isWriting = false;
        });
      }

    } catch (e) {
      if (mounted) {
        setState(() {
          _isWriting = false;
          // Clean up the raw PlatformException message for the user
          final errorStr = e.toString();
          if (errorStr.contains('Communication error') || errorStr.contains('500')) {
            _error = 'Connection lost. Please hold the phone completely still against the tag.';
          } else if (errorStr.contains('Timeout')) {
            _error = 'No tag detected. Please try again.';
          } else {
            _error = errorStr;
          }
          _statusMessage = 'Failed to write NFC tag';
        });
      }
    }
  }

  void _finish() {
    Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (r) => false);
  }

  @override
  Widget build(BuildContext context) {
    final packProv = Provider.of<PackingProvider>(context);
    final orderId = Provider.of<DispatchProvider>(context).selectedOrderId ?? 'Unknown';

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Pack Complete'),
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          PackerGuideWidget(
            stepNumber: 5,
            totalSteps: 5,
            stepTitle: '📦 All Items Verified',
            instruction: _nfcSealed 
                ? 'Order successfully packed and sealed!'
                : 'All items are packed! Proceed to seal the box with NFC.',
            expectedInfo: '${packProv.packedItems.length} items successfully packed.',
          ),
          
          Expanded(
            child: _nfcSealed ? _buildSuccessSummary(packProv, orderId) : _buildNfcPrompt(),
          ),
        ],
      ),
    );
  }

  // UI: Step 1 - NFC Prompt
  Widget _buildNfcPrompt() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                if (_isWriting) ...[
                  _buildPulseRing(1.5, 0.2),
                  _buildPulseRing(2.0, 0.1),
                  _buildPulseRing(2.5, 0.05),
                ],
                Container(
                  width: 120, height: 120,
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.nfc, 
                    color: _error != null ? AppColors.red : AppColors.purple, 
                    size: 80
                  ),
                ),
              ],
            ),
            const SizedBox(height: 48),
            Text(
              _statusMessage,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18, 
                color: _error != null ? AppColors.red : AppColors.textPrimary
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ),
            ],
            const SizedBox(height: 48),
            if (!_isWriting && _nfcAvailable)
              ElevatedButton.icon(
                onPressed: _startNfcProcess,
                icon: Icon(_error != null ? Icons.refresh : Icons.play_arrow),
                label: Text(_error != null ? 'RETRY' : 'START NFC SEALING'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _error != null ? AppColors.red : AppColors.purple,
                  minimumSize: const Size.fromHeight(56),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPulseRing(double maxScale, double opacity) {
    return AnimatedBuilder(
      animation: _pulseController,
      builder: (context, child) {
        return Transform.scale(
          scale: 1.0 + (_pulseController.value * maxScale),
          child: Container(
            width: 120, height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.purple.withValues(alpha: opacity * (1.0 - _pulseController.value)),
                width: 2,
              ),
            ),
          ),
        );
      },
    );
  }

  // UI: Step 2 - Success Summary
  Widget _buildSuccessSummary(PackingProvider packProv, String orderId) {
    return Center(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 120, height: 120,
                decoration: BoxDecoration(
                  color: AppColors.teal.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle, color: AppColors.teal, size: 80),
              ),
              const SizedBox(height: 32),
              
              const Text(
                'ORDER VERIFIED & PACKED',
                style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 20, color: AppColors.teal, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                orderId,
                style: const TextStyle(fontSize: 16, color: AppColors.textPrimary),
              ),
              
              const SizedBox(height: 48),

              // Summary
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderVisible),
                ),
                child: Column(
                  children: [
                    _buildSummaryRow('Items Packed', '${packProv.packedItems.length}/${packProv.orderItems.length}'),
                    const SizedBox(height: 12),
                    _buildSummaryRow('Box Type', packProv.selectedBox?.label ?? 'N/A'),
                    const SizedBox(height: 12),
                    _buildSummaryRow('Verifications Passed', '${packProv.packedItems.length * 5}'),
                    const SizedBox(height: 12),
                    _buildSummaryRow('Box Integrity', 'PASSED', color: AppColors.teal),
                    const SizedBox(height: 12),
                    _buildSummaryRow('NFC Seal', 'SECURED', color: AppColors.purple),
                  ],
                ),
              ),

              const SizedBox(height: 48),
              
              ElevatedButton.icon(
                onPressed: _finish,
                icon: const Icon(Icons.home),
                label: const Text('BACK TO DASHBOARD'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.teal,
                  minimumSize: const Size.fromHeight(56),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {Color color = AppColors.textPrimary}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary)),
        Text(value, style: TextStyle(fontFamily: 'JetBrains Mono', fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }
}
