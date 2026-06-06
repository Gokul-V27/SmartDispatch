import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// SmartDispatch Design System
/// Dark industrial theme with accent-based state indicators
class AppColors {
  static const bg = Color(0xFF04080F);
  static const surface = Color(0xFF080E1C);
  static const elevated = Color(0xFF0C1425);
  static const borderSubtle = Color(0xFF152035);
  static const borderVisible = Color(0xFF1C2D47);
  static const textPrimary = Color(0xFFFFFFFF);
  static const textSecondary = Color(0xFF94A3B8);
  static const textMuted = Color(0xFF4A6380);
  static const orange = Color(0xFFF97316);
  static const blue = Color(0xFF38BDF8);
  static const teal = Color(0xFF22D3A0);
  static const amber = Color(0xFFF59E0B);
  static const red = Color(0xFFEF4444);
  static const purple = Color(0xFFA78BFA);
}

class AppTheme {
  static ThemeData get darkTheme => ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.bg,
    primaryColor: AppColors.orange,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.orange,
      secondary: AppColors.teal,
      surface: AppColors.surface,
      error: AppColors.red,
    ),
    fontFamily: GoogleFonts.inter().fontFamily,
    textTheme: TextTheme(
      headlineLarge: GoogleFonts.jetBrainsMono(
        fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
      headlineMedium: GoogleFonts.jetBrainsMono(
        fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
      titleLarge: GoogleFonts.inter(
        fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
      titleMedium: GoogleFonts.inter(
        fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
      bodyMedium: GoogleFonts.inter(
        fontSize: 13, color: AppColors.textSecondary),
      bodySmall: GoogleFonts.inter(
        fontSize: 11, color: AppColors.textMuted),
      labelSmall: GoogleFonts.jetBrainsMono(
        fontSize: 9, fontWeight: FontWeight.w600, letterSpacing: 1.5, color: AppColors.textMuted),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.surface,
      elevation: 0,
      titleTextStyle: GoogleFonts.jetBrainsMono(
        fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
    ),
    cardTheme: const CardThemeData(
      color: AppColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: AppColors.borderSubtle),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.orange,
        foregroundColor: Colors.black,
        minimumSize: const Size(double.infinity, 48),
        shape: const RoundedRectangleBorder(),
        textStyle: GoogleFonts.jetBrainsMono(
          fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 1),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.bg,
      border: const OutlineInputBorder(
        borderSide: BorderSide(color: AppColors.borderVisible),
        borderRadius: BorderRadius.zero,
      ),
      enabledBorder: const OutlineInputBorder(
        borderSide: BorderSide(color: AppColors.borderVisible),
        borderRadius: BorderRadius.zero,
      ),
      focusedBorder: const OutlineInputBorder(
        borderSide: BorderSide(color: AppColors.orange),
        borderRadius: BorderRadius.zero,
      ),
      labelStyle: GoogleFonts.jetBrainsMono(
        fontSize: 9, fontWeight: FontWeight.w600, letterSpacing: 1.5, color: AppColors.textMuted),
      hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted),
    ),
  );
}
