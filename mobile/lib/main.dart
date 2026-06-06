import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/ocr_scan_screen.dart';
import 'screens/vision_check_screen.dart';
import 'screens/weight_check_screen.dart';
import 'screens/pack_complete_screen.dart';
import 'screens/nfc_seal_screen.dart';
import 'screens/nfc_delivery_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
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
      home: Consumer<AuthService>(
        builder: (context, auth, _) {
          if (auth.isLoggedIn) return const DashboardScreen();
          return const LoginScreen();
        },
      ),
      routes: {
        '/login': (ctx) => const LoginScreen(),
        '/dashboard': (ctx) => const DashboardScreen(),
        '/ocr-scan': (ctx) => const OcrScanScreen(),
        '/vision-check': (ctx) => const VisionCheckScreen(),
        '/weight-check': (ctx) => const WeightCheckScreen(),
        '/pack-complete': (ctx) => const PackCompleteScreen(),
        '/nfc-seal': (ctx) => const NfcSealScreen(),
        '/nfc-delivery': (ctx) => const NfcDeliveryScreen(),
      },
    );
  }
}
