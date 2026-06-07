/// Order status lifecycle matching backend enum Order.OrderStatus
enum OrderStatus {
  pending,
  assigned,
  packing,
  verified,
  packed,
  shipped,
  inTransit,
  delivered,
  cancelled,
}

extension OrderStatusExt on OrderStatus {
  String get label {
    switch (this) {
      case OrderStatus.pending: return 'PENDING';
      case OrderStatus.assigned: return 'ASSIGNED';
      case OrderStatus.packing: return 'PACKING';
      case OrderStatus.verified: return 'VERIFIED';
      case OrderStatus.packed: return 'PACKED';
      case OrderStatus.shipped: return 'SHIPPED';
      case OrderStatus.inTransit: return 'IN_TRANSIT';
      case OrderStatus.delivered: return 'DELIVERED';
      case OrderStatus.cancelled: return 'CANCELLED';
    }
  }

  static OrderStatus fromString(String s) {
    switch (s.toUpperCase()) {
      case 'PENDING': return OrderStatus.pending;
      case 'ASSIGNED': return OrderStatus.assigned;
      case 'PACKING': return OrderStatus.packing;
      case 'VERIFIED': return OrderStatus.verified;
      case 'PACKED': return OrderStatus.packed;
      case 'SHIPPED': return OrderStatus.shipped;
      case 'IN_TRANSIT': return OrderStatus.inTransit;
      case 'DELIVERED': return OrderStatus.delivered;
      case 'CANCELLED': return OrderStatus.cancelled;
      default: return OrderStatus.pending;
    }
  }

  bool get isActive =>
      this == OrderStatus.pending ||
      this == OrderStatus.assigned ||
      this == OrderStatus.packing;
}

/// Individual item within an order — maps to backend OrderItem entity
class OrderItem {
  final String id;
  final String productId;
  final String productName;
  final String productBrand;
  final String productSku;
  String productColor;
  final int quantity;
  bool ocrVerified;
  bool visionVerified;
  bool weightVerified;

  OrderItem({
    required this.id,
    required this.productId,
    required this.productName,
    this.productBrand = '',
    required this.productSku,
    this.productColor = '',
    this.quantity = 1,
    this.ocrVerified = false,
    this.visionVerified = false,
    this.weightVerified = false,
  });

  bool get isFullyVerified => ocrVerified && visionVerified && weightVerified;

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id']?.toString() ?? '',
      productId: json['productId']?.toString() ?? '',
      productName: json['productName'] ?? '',
      productBrand: json['productBrand'] ?? '',
      productSku: json['productSku'] ?? '',
      productColor: json['productColor'] ?? '',
      quantity: json['quantity'] ?? 1,
      ocrVerified: json['ocrVerified'] ?? false,
      visionVerified: json['visionVerified'] ?? false,
      weightVerified: json['weightVerified'] ?? false,
    );
  }
}

/// Full order model — maps to backend OrderController.toOrderMap() response
class Order {
  final String id;
  final String orderNumber;
  final String customerId;
  final String customerName;
  OrderStatus status;
  final double? totalAmount;
  final String? shippingAddress;
  final String? packerId;
  final String? packerName;
  final List<OrderItem> items;
  final String? createdAt;
  String? packedAt;
  bool qrVerified;
  String? nfcSealedAt;

  Order({
    required this.id,
    required this.orderNumber,
    required this.customerId,
    required this.customerName,
    this.status = OrderStatus.pending,
    this.totalAmount,
    this.shippingAddress,
    this.packerId,
    this.packerName,
    required this.items,
    this.createdAt,
    this.packedAt,
    this.qrVerified = false,
    this.nfcSealedAt,
  });

  bool get allItemsVerified => items.every((i) => i.isFullyVerified);

  factory Order.fromJson(Map<String, dynamic> json) {
    final itemsList = (json['items'] as List<dynamic>?)
        ?.map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
        .toList() ?? [];

    return Order(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber'] ?? '',
      customerId: json['customerId']?.toString() ?? '',
      customerName: json['customerName'] ?? '',
      status: OrderStatusExt.fromString(json['status']?.toString() ?? 'PENDING'),
      totalAmount: json['totalAmount'] != null ? (json['totalAmount'] as num).toDouble() : null,
      shippingAddress: json['shippingAddress'],
      packerId: json['packerId']?.toString(),
      packerName: json['packerName'],
      items: itemsList,
      createdAt: json['createdAt']?.toString(),
      packedAt: json['packedAt']?.toString(),
    );
  }
}
