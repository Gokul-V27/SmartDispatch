import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'services/cart_service.dart';
import 'services/dispatch_provider.dart';
import 'services/packing_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/packing_flow_screen.dart';
import 'screens/simulation_panel.dart';
import 'screens/box_damage_screen.dart';
import 'screens/ocr_scan_screen.dart';
import 'screens/color_verify_screen.dart';
import 'screens/size_estimate_screen.dart';
import 'screens/item_confirm_screen.dart';
import 'screens/vision_check_screen.dart';
import 'screens/weight_check_screen.dart';
import 'screens/pack_complete_screen.dart';
import 'screens/nfc_write_screen.dart';
import 'screens/nfc_seal_screen.dart';
import 'screens/seal_confirm_screen.dart';
import 'screens/nfc_delivery_screen.dart';
import 'screens/box_selector_screen.dart';
import 'screens/hub_tracking_screen.dart';
import 'screens/truck_tracking_screen.dart';
import 'screens/client/client_home_screen.dart';
import 'screens/client/product_detail_screen.dart';
import 'screens/client/cart_screen.dart';
import 'screens/client/checkout_screen.dart';
import 'screens/client/order_confirmation_screen.dart';
import 'screens/client/my_orders_screen.dart';
import 'screens/client/order_tracking_screen.dart';
import 'screens/client/delivery_verify_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => CartService()),
        ChangeNotifierProvider(create: (ctx) => DispatchProvider()),
        ChangeNotifierProxyProvider<DispatchProvider, PackingProvider>(
          create: (ctx) => PackingProvider(ctx.read<DispatchProvider>()),
          update: (ctx, dispatch, previous) => previous ?? PackingProvider(dispatch),
        ),
        Provider(create: (_) => ApiService()),
      ],
      child: const SmartDispatchApp(),
    ),
  );
}

class SmartDispatchApp extends StatelessWidget {
  const SmartDispatchApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SmartDispatch',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: Consumer<DispatchProvider>(
        builder: (context, dp, _) {
          if (dp.isLoggedIn) return const DashboardScreen();
          return const LoginScreen();
        },
      ),
      routes: {
        '/login': (ctx) => const LoginScreen(),
        '/dashboard': (ctx) => const DashboardScreen(),
        '/packing-flow': (ctx) => const PackingFlowScreen(),
        '/simulation-panel': (ctx) => const SimulationPanelScreen(),
        '/box-damage': (ctx) => const BoxDamageScreen(),
        '/barcode-scan': (ctx) => const OcrScanScreen(), // aliased to the same OCR scan screen
        '/ocr-scan': (ctx) => const OcrScanScreen(),
        '/color-verify': (ctx) => const ColorVerifyScreen(),
        '/size-estimate': (ctx) => const SizeEstimateScreen(),
        '/item-confirm': (ctx) => const ItemConfirmScreen(),
        '/vision-check': (ctx) => const VisionCheckScreen(),
        '/weight-check': (ctx) => const WeightCheckScreen(),
        '/pack-complete': (ctx) => const PackCompleteScreen(),
        '/nfc-write': (ctx) => const NfcWriteScreen(),
        '/nfc-seal': (ctx) => const NfcSealScreen(),
        '/seal-confirm': (ctx) => const SealConfirmScreen(),
        '/nfc-delivery': (ctx) => const NfcDeliveryScreen(),
        '/box-selector': (ctx) => const BoxSelectorScreen(),
        '/hub-tracking': (ctx) => const HubTrackingScreen(),
        '/truck-tracking': (ctx) => const TruckTrackingScreen(),
        '/client-home': (ctx) => const ClientHomeScreen(),
        '/client-product': (ctx) => const ProductDetailScreen(),
        '/client-cart': (ctx) => const CartScreen(),
        '/client-checkout': (ctx) => const CheckoutScreen(),
        '/client-confirmation': (ctx) => const OrderConfirmationScreen(),
        '/client-orders': (ctx) => const MyOrdersScreen(),
        '/client-tracking': (ctx) => const OrderTrackingScreen(),
        '/client-delivery-verify': (ctx) => const DeliveryVerifyScreen(),
      },
    );
  }
}
