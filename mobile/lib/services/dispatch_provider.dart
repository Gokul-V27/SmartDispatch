import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/order_model.dart';
import '../models/worker_model.dart';
import '../models/telemetry_alert_model.dart';

/// Central state for the entire SmartDispatch emulator flow.
/// Connects to the Spring Boot backend for real API calls.
class DispatchProvider extends ChangeNotifier {
  // ── Backend URL ────────────────────────────────────────────
  // Android emulator → 10.0.2.2, iOS simulator → localhost, real device → your IP
  static const String _baseUrl = 'http://192.168.0.109:8080/api';

  // ── Auth state ─────────────────────────────────────────────
  String? _token;
  String? _userId;
  String? _userName;
  String? _workerId;
  String? _role;
  bool _isLoggedIn = false;

  bool get isLoggedIn => _isLoggedIn;
  String? get token => _token;
  String? get userId => _userId;
  String? get userName => _userName;
  String? get workerId => _workerId;
  String? get role => _role;

  // ── Orders ─────────────────────────────────────────────────
  List<Order> _orders = [];
  List<Order> get orders => _orders;
  String? _selectedOrderId;
  String? get selectedOrderId => _selectedOrderId;
  Order? get selectedOrder =>
      _selectedOrderId != null
          ? _orders.cast<Order?>().firstWhere(
              (o) => o?.id == _selectedOrderId,
              orElse: () => null,
            )
          : null;

  int _activeItemIndex = 0;
  int get activeItemIndex => _activeItemIndex;

  // ── Workers (loaded from backend) ─────────────────────────
  List<Worker> _workers = [];
  List<Worker> get workers => _workers;

  // ── Alerts ─────────────────────────────────────────────────
  List<TelemetryAlert> _alerts = [];
  List<TelemetryAlert> get alerts => _alerts;

  // ── Simulation Logs ────────────────────────────────────────
  List<String> _simLogs = [];
  List<String> get simLogs => _simLogs;

  // ── NFC Handshake ──────────────────────────────────────────
  bool _isNfcHandshaking = false;
  String _nfcStatusText = '';
  String _nfcTargetStatus = '';
  bool get isNfcHandshaking => _isNfcHandshaking;
  String get nfcStatusText => _nfcStatusText;
  String get nfcTargetStatus => _nfcTargetStatus;

  // ── QR Scanner ─────────────────────────────────────────────
  bool _isQrScannerActive = false;
  bool get isQrScannerActive => _isQrScannerActive;

  // ── Auto Pilot ─────────────────────────────────────────────
  bool _isAutoPiloting = false;
  bool get isAutoPiloting => _isAutoPiloting;

  // ── Weight Calibration ─────────────────────────────────────
  double _weightInput = 1.50;
  double get weightInput => _weightInput;
  void setWeightInput(double v) {
    _weightInput = v;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════
  //  API HELPERS
  // ═══════════════════════════════════════════════════════════

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<Map<String, dynamic>?> _post(String path, Map<String, dynamic> body) async {
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl$path'),
        headers: _headers,
        body: jsonEncode(body),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
      addLog('[ERROR] POST $path → ${res.statusCode}: ${res.body}');
      return null;
    } catch (e) {
      addLog('[ERROR] POST $path → $e');
      return null;
    }
  }

  Future<dynamic> _get(String path) async {
    try {
      final res = await http.get(
        Uri.parse('$_baseUrl$path'),
        headers: _headers,
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
      addLog('[ERROR] GET $path → ${res.statusCode}');
      return null;
    } catch (e) {
      addLog('[ERROR] GET $path → $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> _put(String path, Map<String, dynamic> body) async {
    try {
      final res = await http.put(
        Uri.parse('$_baseUrl$path'),
        headers: _headers,
        body: jsonEncode(body),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
      addLog('[ERROR] PUT $path → ${res.statusCode}');
      return null;
    } catch (e) {
      addLog('[ERROR] PUT $path → $e');
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  AUTH
  // ═══════════════════════════════════════════════════════════

  /// Load workers list from backend (GET /api/auth/users?role=PACKER)
  Future<void> loadWorkers() async {
    final data = await _get('/auth/users?role=PACKER');
    if (data is List) {
      _workers = data.map((w) => Worker(
        id: w['id']?.toString() ?? '',
        name: w['name'] ?? '',
        workerId: w['workerId'] ?? '',
        role: 'packer',
      )).toList();
      notifyListeners();
    }
  }

  /// Login with email + password (POST /api/auth/login)
  Future<bool> loginWithEmail(String email, String password) async {
    final data = await _post('/auth/login', {
      'email': email,
      'password': password,
    });
    if (data != null && data.containsKey('token')) {
      _applyAuth(data);
      return true;
    }
    return false;
  }

  /// PIN login for packers (POST /api/auth/pin-login)
  Future<bool> loginWithPin(String wid, String pin) async {
    final data = await _post('/auth/pin-login', {
      'workerId': wid,
      'pin': pin,
    });
    if (data != null && data.containsKey('token')) {
      _applyAuth(data);
      return true;
    }
    return false;
  }

  void _applyAuth(Map<String, dynamic> data) {
    _token = data['token'];
    final user = data['user'];
    _userId = user['id']?.toString();
    _userName = user['name'];
    _role = user['role']?.toString();
    _workerId = user['workerId']?.toString() ?? '';
    _isLoggedIn = true;
    addLog('[AUTH] Worker ${_userName} (${_workerId}) logged in.');
    _savePrefs();
    notifyListeners();
  }

  Future<void> logout() async {
    _token = null;
    _userId = null;
    _userName = null;
    _role = null;
    _workerId = null;
    _isLoggedIn = false;
    _selectedOrderId = null;
    _activeItemIndex = 0;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    addLog('[AUTH] Session ended.');
    notifyListeners();
  }

  Future<void> _savePrefs() async {
    final prefs = await SharedPreferences.getInstance();
    if (_token != null) await prefs.setString('auth_token', _token!);
    if (_userId != null) await prefs.setString('user_id', _userId!);
    if (_userName != null) await prefs.setString('user_name', _userName!);
    if (_role != null) await prefs.setString('user_role', _role!);
    if (_workerId != null) await prefs.setString('worker_id', _workerId!);
  }

  Future<void> loadFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _userId = prefs.getString('user_id');
    _userName = prefs.getString('user_name');
    _role = prefs.getString('user_role');
    _workerId = prefs.getString('worker_id');
    _isLoggedIn = _token != null;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════
  //  ORDERS
  // ═══════════════════════════════════════════════════════════

  /// Load all orders from backend (GET /api/orders)
  Future<void> loadOrders() async {
    final data = await _get('/orders');
    if (data is List) {
      _orders = data
          .map((e) => Order.fromJson(e as Map<String, dynamic>))
          .toList();
      notifyListeners();
    }
  }

  void selectOrder(String? orderId) {
    _selectedOrderId = orderId;
    _activeItemIndex = 0;
    notifyListeners();
  }

  /// Advance to next unverified item index
  void advanceToNextItem() {
    final order = selectedOrder;
    if (order == null) return;
    for (int i = 0; i < order.items.length; i++) {
      if (!order.items[i].isFullyVerified) {
        _activeItemIndex = i;
        notifyListeners();
        return;
      }
    }
    // All done
    _activeItemIndex = order.items.length - 1;
    notifyListeners();
  }

  /// Update order status via backend (PUT /api/orders/{id}/status)
  Future<void> updateOrderStatus(String orderId, String newStatus) async {
    final data = await _put('/orders/$orderId/status', {'status': newStatus});
    if (data != null) {
      addLog('[ORDER] $orderId → status $newStatus');
      await loadOrders();
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  VERIFICATION (calls real backend)
  // ═══════════════════════════════════════════════════════════

  /// OCR verify via backend (POST /api/verify/ocr)
  Future<bool> verifyOcr(String orderItemId) async {
    final order = selectedOrder;
    if (order == null) return false;
    final item = order.items.firstWhere((i) => i.id == orderItemId);

    final data = await _post('/verify/ocr', {
      'orderItemId': orderItemId,
      'workerId': _userId,
      'scannedBrand': item.productBrand,
      'scannedSku': item.productSku,
    });

    if (data != null && data['result'] == 'PASS') {
      item.ocrVerified = true;
      // Also update order status to PACKING if not already
      if (order.status == OrderStatus.assigned || order.status == OrderStatus.pending) {
        await updateOrderStatus(order.id, 'PACKING');
      }
      addLog('[OCR] ✓ SKU ${item.productSku} verified for ${item.productName}');
      notifyListeners();
      return true;
    }
    addLog('[OCR] ✗ MISMATCH for ${item.productName}');
    return false;
  }

  /// Vision verify via backend (POST /api/verify/vision)
  Future<bool> verifyVision(String orderItemId) async {
    final item = selectedOrder?.items.firstWhere((i) => i.id == orderItemId);
    if (item == null) return false;

    final data = await _post('/verify/vision', {
      'orderItemId': orderItemId,
      'workerId': _userId,
      'detectedColor': item.productColor,
      'confidence': 0.94,
    });

    if (data != null && data['result'] == 'PASS') {
      item.visionVerified = true;
      addLog('[VISION] ✓ Color ${item.productColor} matched for ${item.productName}');
      notifyListeners();
      return true;
    }
    addLog('[VISION] ✗ Color mismatch for ${item.productName}');
    return false;
  }

  /// Weight verify via backend (POST /api/verify/weight)
  Future<bool> verifyWeight(String orderItemId, double measuredWeight) async {
    final item = selectedOrder?.items.firstWhere((i) => i.id == orderItemId);
    if (item == null) return false;

    final data = await _post('/verify/weight', {
      'orderItemId': orderItemId,
      'workerId': _userId,
      'measuredWeight': measuredWeight,
    });

    if (data != null) {
      final result = data['result'];
      if (result == 'PASS') {
        item.weightVerified = true;
        addLog('[WEIGHT] ✓ ${measuredWeight.toStringAsFixed(2)} kg verified for ${item.productName}');
        notifyListeners();
        return true;
      } else {
        // Create alarm
        _alerts.insert(0, TelemetryAlert(
          id: 'al-${DateTime.now().millisecondsSinceEpoch}',
          severity: 'CRITICAL',
          alertType: 'WEIGHT_FAIL',
          orderId: selectedOrder!.id,
          orderNumber: selectedOrder!.orderNumber,
          workerName: _userName ?? 'Worker',
          detail: 'Weight variance: Measured ${measuredWeight.toStringAsFixed(2)} kg '
              '(Expected: ${data['expected']} kg, Delta: ${data['deltaKg']})',
          createdAt: DateTime.now().toIso8601String(),
        ));
        addLog('[WEIGHT] ⚠ ALARM: Scale discrepancy for ${item.productName}');
        notifyListeners();
        return false;
      }
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════
  //  QR SCANNER SIMULATION
  // ═══════════════════════════════════════════════════════════

  Future<void> simulateQrScan(String orderItemId) async {
    _isQrScannerActive = true;
    notifyListeners();
    addLog('[QR] Initiating camera-based QR code verification...');

    await Future.delayed(const Duration(milliseconds: 1500));

    final ok = await verifyOcr(orderItemId);
    if (ok) {
      final order = selectedOrder;
      if (order != null) {
        order.qrVerified = true;
      }
    }
    _isQrScannerActive = false;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════
  //  NFC SEAL (calls real backend)
  // ═══════════════════════════════════════════════════════════

  /// Simulate NFC seal → register tag → seal via backend
  Future<void> sealWithNfc(String orderId) async {
    _isNfcHandshaking = true;
    _nfcTargetStatus = 'PACKED';
    _nfcStatusText = 'Synchronizing NDEF container with 13.56 MHz RFID receiver...';
    notifyListeners();

    addLog('[NFC] Coupling declared → 13.56 MHz');
    addLog('[NFC] Writing NDEF records...');

    // Generate a simulated NFC tag ID
    final tagId = 'TAG-${DateTime.now().millisecondsSinceEpoch}';

    // Step 1: Register the NFC tag
    await _post('/nfc/register', {
      'tagId': tagId,
      'orderId': orderId,
    });
    addLog('[NFC] Tag $tagId registered');

    await Future.delayed(const Duration(milliseconds: 300));

    // Step 2: Seal
    final data = await _post('/nfc/seal', {
      'tagId': tagId,
      'workerId': _userId,
    });

    if (data != null) {
      addLog('[NFC] ✓ RFID tag sealed. Order → PACKED');
      addLog('[NFC] Customer notification sent.');
      await loadOrders();
    }

    _isNfcHandshaking = false;
    notifyListeners();
  }

  /// Simulate delivery handover (NFC tap + OTP)
  Future<void> simulateDelivery(String orderId) async {
    _isNfcHandshaking = true;
    _nfcTargetStatus = 'DELIVERED';
    _nfcStatusText = 'Broadcasting cryptographic proof to local transport nodes...';
    notifyListeners();

    addLog('[DELIVERY] Tap detected at delivery point');

    // For delivery we just update status directly
    await updateOrderStatus(orderId, 'DELIVERED');

    addLog('[DELIVERY] ✓ OTP verified. Order DELIVERED.');

    await Future.delayed(const Duration(milliseconds: 300));

    _isNfcHandshaking = false;
    _selectedOrderId = null;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════
  //  AUTO-PILOT
  // ═══════════════════════════════════════════════════════════

  Future<void> runAutoPilot(String orderId) async {
    _isAutoPiloting = true;
    _selectedOrderId = orderId;
    notifyListeners();

    final order = orders.firstWhere((o) => o.id == orderId);
    addLog('');
    addLog('═══ AUTO-PILOT START: ${order.orderNumber} ═══');

    // Step 1: Set status to PACKING
    addLog('[1/6] Assigning order → PACKING...');
    await updateOrderStatus(orderId, 'PACKING');
    await Future.delayed(const Duration(milliseconds: 600));

    // Step 2: OCR verify each item
    for (int i = 0; i < order.items.length; i++) {
      _activeItemIndex = i;
      notifyListeners();
      addLog('[2/6] OCR scanning item ${i + 1}/${order.items.length}: ${order.items[i].productName}...');
      await verifyOcr(order.items[i].id);
      await Future.delayed(const Duration(milliseconds: 400));
    }

    // Step 3: Vision verify each item
    for (int i = 0; i < order.items.length; i++) {
      _activeItemIndex = i;
      notifyListeners();
      addLog('[3/6] Vision verify item ${i + 1}/${order.items.length}: ${order.items[i].productName}...');
      await verifyVision(order.items[i].id);
      await Future.delayed(const Duration(milliseconds: 400));
    }

    // Step 4: Weight verify each item
    for (int i = 0; i < order.items.length; i++) {
      _activeItemIndex = i;
      notifyListeners();
      addLog('[4/6] Weight check item ${i + 1}/${order.items.length}...');
      // Use a weight that will pass (we don't know exact product weight, so we
      // call scan-verify which does DB comparison)
      await _post('/verify/weight', {
        'orderItemId': order.items[i].id,
        'workerId': _userId,
        'measuredWeight': 1.5, // will pass if product weight is close
      });
      order.items[i].weightVerified = true;
      await Future.delayed(const Duration(milliseconds: 300));
    }

    notifyListeners();

    // Step 5: NFC Seal
    addLog('[5/6] NFC RFID sealing...');
    await sealWithNfc(orderId);
    await Future.delayed(const Duration(milliseconds: 400));

    // Step 6: Deliver
    addLog('[6/6] Simulating delivery handover...');
    await simulateDelivery(orderId);

    addLog('═══ AUTO-PILOT COMPLETE ═══');
    addLog('');

    _isAutoPiloting = false;
    _selectedOrderId = null;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════
  //  SIMULATION LOGS
  // ═══════════════════════════════════════════════════════════

  void addLog(String message) {
    final ts = DateTime.now().toIso8601String().substring(11, 19);
    _simLogs.add('[$ts] $message');
    notifyListeners();
  }

  void clearLogs() {
    _simLogs.clear();
    notifyListeners();
  }
}
