import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// API service connecting Flutter app to Spring Boot backend.
class ApiService {
  // Change this to your server IP when testing on a physical device
  static const String baseUrl = 'http://192.168.0.109:8080/api'; // Real device on local network

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<Map<String, String>> _headers() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ── Auth ────────────────────────────────────────────────────
  Future<Map<String, dynamic>?> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  Future<Map<String, dynamic>?> pinLogin(String workerId, String pin) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/pin-login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'workerId': workerId, 'pin': pin}),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  // ── Orders ──────────────────────────────────────────────────
  Future<List<dynamic>> getOrders({String? status}) async {
    final query = status != null ? '?status=$status' : '';
    final res = await http.get(
      Uri.parse('$baseUrl/orders$query'),
      headers: await _headers(),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return [];
  }

  Future<Map<String, dynamic>?> getOrder(String orderId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/orders/$orderId'),
      headers: await _headers(),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  Future<Map<String, dynamic>?> updateOrderStatus(String orderId, String status) async {
    final res = await http.put(
      Uri.parse('$baseUrl/orders/$orderId/status'),
      headers: await _headers(),
      body: jsonEncode({'status': status}),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  // ── Verification ────────────────────────────────────────────
  Future<Map<String, dynamic>?> verifyOcr({
    required String orderItemId,
    required String workerId,
    required String scannedBrand,
    required String scannedSku,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/verify/ocr'),
      headers: await _headers(),
      body: jsonEncode({
        'orderItemId': orderItemId,
        'workerId': workerId,
        'scannedBrand': scannedBrand,
        'scannedSku': scannedSku,
      }),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  Future<Map<String, dynamic>?> verifyVision({
    required String orderItemId,
    required String workerId,
    required String detectedColor,
    required double confidence,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/verify/vision'),
      headers: await _headers(),
      body: jsonEncode({
        'orderItemId': orderItemId,
        'workerId': workerId,
        'detectedColor': detectedColor,
        'confidence': confidence,
      }),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  Future<Map<String, dynamic>?> verifyWeight({
    required String orderItemId,
    required String workerId,
    required double measuredWeight,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/verify/weight'),
      headers: await _headers(),
      body: jsonEncode({
        'orderItemId': orderItemId,
        'workerId': workerId,
        'measuredWeight': measuredWeight,
      }),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  // ── Products ────────────────────────────────────────────────
  Future<List<dynamic>> getProducts() async {
    final res = await http.get(
      Uri.parse('$baseUrl/products'),
      headers: await _headers(),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return [];
  }

  Future<Map<String, dynamic>?> getProductBySku(String sku) async {
    final res = await http.get(
      Uri.parse('$baseUrl/products/sku/$sku'),
      headers: await _headers(),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  /// Combined scan-verify: send scanned SKU → backend auto-compares everything
  /// Returns: result, skuMatch, brandMatch, colorMatch, weightResult, expected, scanned, weight
  Future<Map<String, dynamic>?> scanVerify({
    required String orderItemId,
    required String workerId,
    required String scannedSku,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/verify/scan-verify'),
      headers: await _headers(),
      body: jsonEncode({
        'orderItemId': orderItemId,
        'workerId': workerId,
        'scannedSku': scannedSku,
      }),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  // ── Label ───────────────────────────────────────────────────
  Future<Map<String, dynamic>?> getLabelData(String orderId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/label/$orderId/data'),
      headers: await _headers(),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  // ── AI Vision ───────────────────────────────────────────────

  /// Compare worker's captured photo against product reference image.
  /// Sends multipart form with image file + orderItemId + workerId.
  /// Returns: mode, result, overallScore, colorHistogramScore, etc.
  Future<Map<String, dynamic>?> visionCompareOrderItem({
    required String orderItemId,
    required String workerId,
    required String filePath,
  }) async {
    final token = await _getToken();
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/vision/compare-order-item'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    request.fields['orderItemId'] = orderItemId;
    request.fields['workerId'] = workerId;
    request.files.add(await http.MultipartFile.fromPath('file', filePath));

    final streamedRes = await request.send();
    final res = await http.Response.fromStream(streamedRes);
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  /// Analyze a single image for dominant color.
  Future<Map<String, dynamic>?> visionAnalyze(String filePath) async {
    final token = await _getToken();
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/vision/analyze'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    request.files.add(await http.MultipartFile.fromPath('file', filePath));

    final streamedRes = await request.send();
    final res = await http.Response.fromStream(streamedRes);
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  // ── NFC ─────────────────────────────────────────────────────

  /// Register NFC tag with an order (when writing tag)
  Future<Map<String, dynamic>?> nfcRegister({
    required String tagId,
    required String orderId,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/nfc/register'),
      headers: await _headers(),
      body: jsonEncode({'tagId': tagId, 'orderId': orderId}),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  /// Packer taps NFC → seal confirmed → customer notified
  Future<Map<String, dynamic>?> nfcSeal({
    required String tagId,
    required String workerId,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/nfc/seal'),
      headers: await _headers(),
      body: jsonEncode({'tagId': tagId, 'workerId': workerId}),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  /// Delivery person taps NFC → OTP generated → sent to customer
  Future<Map<String, dynamic>?> nfcDeliveryTap({
    required String tagId,
    required String deliveryPersonId,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/nfc/delivery-tap'),
      headers: await _headers(),
      body: jsonEncode({'tagId': tagId, 'deliveryPersonId': deliveryPersonId}),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  /// Verify delivery OTP from customer
  Future<Map<String, dynamic>?> nfcVerifyOtp({
    required String tagId,
    required String otp,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/nfc/verify-otp'),
      headers: await _headers(),
      body: jsonEncode({'tagId': tagId, 'otp': otp}),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  /// Get NFC tag status
  Future<Map<String, dynamic>?> getNfcTag(String tagId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/nfc/tag/$tagId'),
      headers: await _headers(),
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }
}
