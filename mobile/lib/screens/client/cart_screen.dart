import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../services/cart_service.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartService>();
    final items = cart.items.values.toList();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Your Cart'),
        actions: [
          if (items.isNotEmpty)
            IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => cart.clear()),
        ],
      ),
      body: items.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.shopping_cart_outlined, size: 64, color: AppColors.textMuted),
                  const SizedBox(height: 16),
                  const Text('Your cart is empty', style: TextStyle(fontSize: 18, color: AppColors.textSecondary)),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('BROWSE PRODUCTS'),
                  )
                ],
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    itemBuilder: (ctx, i) {
                      final item = items[i];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: AppColors.surface, border: Border.all(color: AppColors.borderVisible)),
                        child: Row(
                          children: [
                            Container(width: 60, height: 60, color: AppColors.bg, child: const Icon(Icons.image, color: AppColors.textMuted)),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.product.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                  Text('₹${item.product.price.toStringAsFixed(0)}', style: const TextStyle(fontFamily: 'JetBrains Mono', color: AppColors.teal)),
                                ],
                              ),
                            ),
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove_circle_outline, color: AppColors.orange),
                                  onPressed: () => cart.updateQuantity(item.product.id, item.quantity - 1),
                                ),
                                Text('${item.quantity}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                IconButton(
                                  icon: const Icon(Icons.add_circle_outline, color: AppColors.teal),
                                  onPressed: () => cart.updateQuantity(item.product.id, item.quantity + 1),
                                ),
                              ],
                            )
                          ],
                        ),
                      );
                    },
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    border: Border(top: BorderSide(color: AppColors.borderVisible)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Subtotal', style: TextStyle(color: AppColors.textSecondary)),
                          Text('₹${cart.subtotal.toStringAsFixed(0)}', style: const TextStyle(fontFamily: 'JetBrains Mono', fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Delivery', style: TextStyle(color: AppColors.textSecondary)),
                          const Text('₹50', style: TextStyle(fontFamily: 'JetBrains Mono', fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const Divider(color: AppColors.borderSubtle, height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          Text('₹${(cart.subtotal + 50).toStringAsFixed(0)}', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.teal)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () => Navigator.pushNamed(context, '/client-checkout'),
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.teal),
                          child: const Text('PROCEED TO CHECKOUT'),
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
