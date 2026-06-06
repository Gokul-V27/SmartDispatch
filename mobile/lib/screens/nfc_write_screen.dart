import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:ndef/ndef.dart' as ndef;
import 'dart:convert';
import 'package:uuid/uuid.dart';
import '../core/theme.dart';
import '../core/crypto_utils.dart';
import '../services/packing_provider.dart';
import '../services/dispatch_provider.dart';

class NfcWriteScreen extends StatefulWidget {
  const NfcWriteScreen({super.key});

  @override
  State<NfcWriteScreen> createState() => _NfcWriteScreenState();
}

class _NfcWriteScreenState extends State<NfcWriteScreen> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  bool _isWriting = false;
  String _statusMessage = 'Ready to tag';
  bool _success = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    final packProv = Provider.of<PackingProvider>(context, listen: false);
    if (packProv.isAutoProcessing) {
      Future.delayed(const Duration(milliseconds: 1500), () {
        if (mounted) _startNfcProcess();
      });
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _startNfcProcess() async {
    setState(() {
      _isWriting = true;
      _statusMessage = 'Hold the phone against the NFC tag on the box lid.';
      _error = null;
    });

    final packProv = Provider.of<PackingProvider>(context, listen: false);
    final dp = Provider.of<DispatchProvider>(context, listen: false);
    
    try {
      final orderId = dp.selectedOrderId ?? 'UNKNOWN';
      
      // Build Payload
      final payloadData = {
        "orderId": orderId,
        "sessionId": const Uuid().v4(),
        "packerId": "PKR-007", // Mock worker id
        "boxId": packProv.selectedBox?.id ?? 'UNKNOWN',
        "packedAt": DateTime.now().toIso8601String(),
        "clientName": "Test Client",
        "clientPhone": "+919876543210",
        "clientEmail": "test@example.com",
        "address": {
          "line1": "42, Anna Nagar",
          "city": "Chennai",
          "pincode": "600040",
          "state": "Tamil Nadu"
        },
        "items": packProv.packedItems.map((i) => {
          "sku": i.productId,
          "name": i.productName,
          "qty": i.quantity,
          "color": i.productColor,
          "dims": {"l": 10, "w": 10, "h": 5},
          "verified": i.isFullyVerified
        }).toList()
      };

      final jsonStr = jsonEncode(payloadData);
      final encryptedPayload = CryptoUtils.encryptPayload(jsonStr);

      if (packProv.isAutoProcessing) {
        // Simulating NFC hardware
        await Future.delayed(const Duration(seconds: 2));
      } else {
        // Real NFC hardware
        final tag = await FlutterNfcKit.poll(timeout: const Duration(seconds: 15));
        if (tag.ndefAvailable != true) {
          throw Exception('NDEF not available on this tag');
        }
        
        final record = ndef.TextRecord(text: encryptedPayload, language: 'en');
        await FlutterNfcKit.writeNDEFRecords([record]);
        await FlutterNfcKit.finish();
      }

      // Notify backend that tag is sealed
      // In a real app, you would POST to /api/nfc/seal here.
      // For now, we simulate success and return to dashboard.

      if (mounted) {
        setState(() {
          _success = true;
          _isWriting = false;
          _statusMessage = 'Box tagged successfully';
        });
        
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (r) => false);
          }
        });
      }

    } catch (e) {
      if (mounted) {
        setState(() {
          _isWriting = false;
          _error = e.toString();
          _statusMessage = 'Failed to write NFC tag';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Seal & Tag Box'),
        automaticallyImplyLeading: false,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_success) ...[
                const Icon(Icons.check_circle, color: AppColors.teal, size: 100),
                const SizedBox(height: 24),
                Text(
                  _statusMessage,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.teal),
                ),
              ] else ...[
                Stack(
                  alignment: Alignment.center,
                  children: [
                    if (_isWriting) ...[
                      _buildPulseRing(1.5, 0.2),
                      _buildPulseRing(2.0, 0.1),
                      _buildPulseRing(2.5, 0.05),
                    ],
                    Container(
                      width: 100, height: 100,
                      decoration: const BoxDecoration(
                        color: AppColors.surface,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.nfc, 
                        color: _error != null ? AppColors.red : AppColors.purple, 
                        size: 60
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
                if (!_isWriting)
                  ElevatedButton.icon(
                    onPressed: _startNfcProcess,
                    icon: Icon(_error != null ? Icons.refresh : Icons.play_arrow),
                    label: Text(_error != null ? 'RETRY' : 'START TAGGING'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _error != null ? AppColors.red : AppColors.purple,
                      minimumSize: const Size.fromHeight(56),
                    ),
                  ),
              ]
            ],
          ),
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
            width: 100, height: 100,
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
}
