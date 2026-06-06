import 'package:flutter/material.dart';
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

  bool isAutoProcessing = true; // Default as requested
  bool isLoading = false;
  String? error;

  PackingProvider(this._dispatchProvider);

  OrderItem? get currentItem => 
      (orderItems.isNotEmpty && currentItemIndex < orderItems.length) 
          ? orderItems[currentItemIndex] 
          : null;

  bool get isOrderComplete => 
      orderItems.isNotEmpty && packedItems.length >= orderItems.length;

  // --- Actions ---

  void setAutoProcess(bool val) {
    isAutoProcessing = val;
    notifyListeners();
  }

  void startPackingFlow(BoxSize box) async {
    selectedBox = box;
    currentItemIndex = 0;
    packedItems.clear();
    _resetGates();
    isLoading = true;
    error = null;
    notifyListeners();

    try {
      final orderId = _dispatchProvider.selectedOrderId;
      if (orderId == null) throw Exception('No order selected');

      // Fetch the order from the API to get its items
      final response = await _dio.get('/orders/$orderId');
      final order = Order.fromJson(response.data);
      
      orderItems = order.items ?? [];
      
      isLoading = false;
      notifyListeners();
    } catch (e) {
      isLoading = false;
      error = e.toString();
      notifyListeners();
    }
  }

  void passGate(GateType gate) {
    currentItemGates[gate] = true;
    notifyListeners();
  }

  void failGate(GateType gate) {
    currentItemGates[gate] = false;
    notifyListeners();
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

  // Completes the order in the backend
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
      return response.data;
    } catch (e) {
      return {'result': 'FAIL', 'error': e.toString()};
    }
  }
}
