import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../models/client_models.dart';
import '../../services/cart_service.dart';

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({super.key});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _qty = 1;

  @override
  Widget build(BuildContext context) {
    final product = ModalRoute.of(context)!.settings.arguments as Product;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart),
            onPressed: () => Navigator.pushNamed(context, '/client-cart'),
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 300,
                    width: double.infinity,
                    color: AppColors.surface,
                    child: const Center(child: Icon(Icons.image, size: 96, color: AppColors.textMuted)),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (product.tags.isNotEmpty)
                          Wrap(
                            spacing: 8,
                            children: product.tags.map((t) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(color: AppColors.purple.withValues(alpha: 0.1), border: Border.all(color: AppColors.purple)),
                              child: Text(t, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.purple)),
                            )).toList(),
                          ),
                        const SizedBox(height: 12),
                        Text(product.name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text('${product.weightKg} kg · SKU: ${product.sku}', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, color: AppColors.textSecondary)),
                        const SizedBox(height: 16),
                        Text('₹${product.price.toStringAsFixed(0)}', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.teal)),
                        const SizedBox(height: 24),
                        const Text('Description', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text(product.description, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5)),
                      ],
                    ),
                  )
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.borderVisible)),
            ),
            child: Row(
              children: [
                Container(
                  decoration: BoxDecoration(border: Border.all(color: AppColors.borderVisible), borderRadius: BorderRadius.circular(8)),
                  child: Row(
                    children: [
                      IconButton(icon: const Icon(Icons.remove), onPressed: () => setState(() { if (_qty > 1) _qty--; })),
                      Text('$_qty', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      IconButton(icon: const Icon(Icons.add), onPressed: () => setState(() { _qty++; })),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      context.read<CartService>().addItem(product, quantity: _qty);
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Added to cart')));
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                    child: Text('ADD TO CART (₹${(product.price * _qty).toStringAsFixed(0)})'),
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}
