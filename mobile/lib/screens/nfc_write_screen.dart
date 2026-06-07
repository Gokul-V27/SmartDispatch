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

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
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
      final orderId = dp.selectedOrderId ?? 'UNKNOWN';
      final order = dp.selectedOrder;
      
      // Build Payload
      final payloadData = {
        "orderId": orderId,
        "sessionId": const Uuid().v4(),
        "packerId": "PKR-007", 
        "boxId": packProv.selectedBox?.id ?? 'UNKNOWN',
        "packedAt": DateTime.now().toIso8601String(),
        "clientName": order?.customerName ?? "Test Client",
        "clientPhone": "+919876543210", // In real app, fetch from order
        "clientEmail": "client@example.com",
        "address": {
          "line1": order?.shippingAddress ?? "123 Main St",
          "city": "Unknown",
          "pincode": "000000",
          "state": "Unknown"
        },
        "items": packProv.packedItems.map((i) => {
          "sku": i.productSku,
          "name": i.productName,
          "qty": i.quantity,
          "color": i.productColor,
          "dims": {"l": 10, "w": 10, "h": 5},
          "verified": i.isFullyVerified
        }).toList()
      };

      final jsonStr = jsonEncode(payloadData);
      final encryptedPayload = CryptoUtils.encryptPayload(jsonStr);

      String tagId = const Uuid().v4();

      if (packProv.isAutoProcessing || !_nfcAvailable) {
        // Simulating NFC hardware
        await Future.delayed(const Duration(seconds: 2));
      } else {
        // Real NFC hardware
        final tag = await FlutterNfcKit.poll(timeout: const Duration(seconds: 15));
        if (tag.ndefAvailable != true) {
          throw Exception('NDEF not available on this tag');
        }
        
        tagId = tag.id; // Get physical tag ID
        
        final record = ndef.TextRecord(text: encryptedPayload, language: 'en');
        await FlutterNfcKit.writeNDEFRecords([record]);
        await FlutterNfcKit.finish();
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
          _success = true;
          _isWriting = false;
          _statusMessage = 'Box tagged and sealed successfully!';
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
                  textAlign: TextAlign.center,
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
                if (!_isWriting && _nfcAvailable)
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
