import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../models/box_models.dart';
import '../models/order_model.dart';
import '../core/constants.dart';
import '../services/dispatch_provider.dart';

enum GateType {
  boxIntegrity,
  identity,
  color,
  category,
  size
}

class PackingProvider extends ChangeNotifier {
  final Dio _dio = Dio(BaseOptions(baseUrl: AppConstants.apiUrl));
  final DispatchProvider _dispatchProvider;

  BoxSize? selectedBox;
  List<OrderItem> orderItems = [];
  int currentItemIndex = 0;
  List<OrderItem> packedItems = [];
  
  // Gate tracking for current item
  Map<GateType, bool> currentItemGates = {
    GateType.boxIntegrity: false,
    GateType.identity: false,
    GateType.color: false,
    GateType.category: false,
    GateType.size: false,
  };

  bool isAutoProcessing = false; // Turned off to allow real camera usage
  bool isLoading = false;
  String? error;

  PackingProvider(this._dispatchProvider) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
    ));
  }

  OrderItem? get currentItem => 
      (orderItems.isNotEmpty && currentItemIndex < orderItems.length) 
          ? orderItems[currentItemIndex] 
          : null;

  bool get isOrderComplete => 
      orderItems.isNotEmpty && packedItems.length >= orderItems.length;

  int get totalGatesRequired => 5;
  int get completedGates => currentItemGates.values.where((v) => v).length;

  String get currentStepLabel {
    if (currentItemGates[GateType.boxIntegrity] == false) return '📦 Box Integrity Check';
    if (currentItemGates[GateType.identity] == false) return '🔍 Identity Scan';
    if (currentItemGates[GateType.color] == false) return '🎨 Color Verify';
    if (currentItemGates[GateType.size] == false && currentItemGates[GateType.category] == false) return '📏 Size Check';
    return '✅ Confirm & Pack';
  }

  // --- Actions ---

  void setAutoProcess(bool val) {
    isAutoProcessing = val;
    notifyListeners();
  }

  void startPackingFlow(BoxSize box, {List<OrderItem>? items}) {
    selectedBox = box;
    currentItemIndex = 0;
    packedItems.clear();
    _resetGates();
    isLoading = false;
    error = null;
    
    if (items != null) {
      orderItems = items;
    } else {
      final order = _dispatchProvider.selectedOrder;
      if (order != null) {
        orderItems = order.items;
      }
    }
    
    notifyListeners();
  }

  void passGate(GateType gate) {
    currentItemGates[gate] = true;
    syncGateToBackend(gate);
    notifyListeners();
  }

  void failGate(GateType gate) {
    currentItemGates[gate] = false;
    notifyListeners();
  }

  void syncGateToBackend(GateType gate) {
    if (currentItem == null) return;
    
    // In a real scenario, this syncs with DispatchProvider and calls backend APIs
    if (gate == GateType.identity) {
      _dispatchProvider.verifyOcr(currentItem!.id);
    } else if (gate == GateType.color) {
      _dispatchProvider.verifyVision(currentItem!.id);
    } else if (gate == GateType.size || gate == GateType.category) {
      _dispatchProvider.verifyWeight(currentItem!.id, 0.0);
    }
  }

  void confirmCurrentItemPacked() {
    if (currentItem != null && !packedItems.contains(currentItem)) {
      packedItems.add(currentItem!);
    }
    currentItemIndex++;
    _resetGates();
    notifyListeners();
  }

  void _resetGates() {
    // Note: boxIntegrity is only checked once per box at the start (Screen 2)
    // We persist it if it was already passed.
    final boxPass = currentItemGates[GateType.boxIntegrity] ?? false;
    currentItemGates = {
      GateType.boxIntegrity: boxPass,
      GateType.identity: false,
      GateType.color: false,
      GateType.category: false,
      GateType.size: false,
    };
  }

  Future<bool> registerNfcTag(String tagId) async {
    final orderId = _dispatchProvider.selectedOrderId;
    if (orderId == null) return false;
    try {
      await _dio.post('/nfc/register', data: {
        'tagId': tagId,
        'orderId': orderId
      });
      return true;
    } catch (e) {
      error = e.toString();
      return false;
    }
  }

  Future<bool> sealNfcTag(String tagId) async {
    // In a real app we'd fetch workerId from Auth service
    final workerId = '11111111-1111-1111-1111-111111111111'; // Mock worker
    try {
      await _dio.post('/nfc/seal', data: {
        'tagId': tagId,
        'workerId': workerId
      });
      _dispatchProvider.loadOrders(); // Refresh order list
      return true;
    } catch (e) {
      error = e.toString();
      return false;
    }
  }

  // Completes the order in the backend (legacy fallback)
  Future<bool> submitPackSession() async {
    final orderId = _dispatchProvider.selectedOrderId;
    if (orderId == null) return false;
    
    isLoading = true;
    notifyListeners();

    try {
      await _dio.put('/orders/$orderId/status', data: {
        'status': 'PACKED'
      });
      
      // Also update the dispatch provider state so Dashboard reflects it
      _dispatchProvider.loadOrders();
      
      isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      isLoading = false;
      error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // --- Automated Verification Endpoints ---

  /// Verify via combined backend endpoint (used in OCR fallback or barcode scan)
  Future<Map<String, dynamic>> verifyItemBackend(String scannedSku) async {
    if (currentItem == null) throw Exception('No current item');
    
    try {
      final response = await _dio.post('/verify/scan-verify', data: {
        'scannedSku': scannedSku,
        'orderItemId': currentItem!.id,
        'workerId': '00000000-0000-0000-0000-000000000000', // Mock UUID for worker since we don't have it in state
      });
      
      final data = response.data;
      if (data['expected'] != null) {
        final expectedColor = data['expected']['color'];
        if (expectedColor != null && expectedColor.toString().isNotEmpty) {
          currentItem!.productColor = expectedColor.toString();
        }
      }
      
      return data;
    } catch (e) {
      return {'result': 'FAIL', 'error': e.toString()};
    }
  }
}
