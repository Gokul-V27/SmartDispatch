class Product {
  final String id;
  final String name;
  final String description;
  final String category;
  final double price;
  final double weightKg;
  final String sku;
  final bool inStock;
  final List<String> tags; // e.g. 'ORGANIC', 'FRAGILE', 'GLASS', 'LIQUID'

  const Product({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.price,
    required this.weightKg,
    required this.sku,
    required this.inStock,
    this.tags = const [],
  });
}

class CartItem {
  final Product product;
  int quantity;

  CartItem({required this.product, this.quantity = 1});
  
  double get totalWeight => product.weightKg * quantity;
  double get totalPrice => product.price * quantity;
}
