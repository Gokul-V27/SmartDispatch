import 'package:encrypt/encrypt.dart';
import 'dart:convert';

/// Utilities for AES-256-GCM encryption of NFC NDEF payloads.
class CryptoUtils {
  // 32-byte shared key. In a real app, this should be fetched securely or obfuscated.
  static const _keyStr = 'SMARTDISPATCH_AES256_KEY_2026_V1';
  
  static String encryptPayload(String jsonPayload) {
    try {
      final key = Key.fromUtf8(_keyStr);
      final iv = IV.fromSecureRandom(12); // GCM standard IV size
      
      final encrypter = Encrypter(AES(key, mode: AESMode.gcm));
      final encrypted = encrypter.encrypt(jsonPayload, iv: iv);
      
      // Combine IV and Ciphertext (Base64) to store on the NFC tag
      // Format: iv_base64:ciphertext_base64
      return '${iv.base64}:${encrypted.base64}';
    } catch (e) {
      print('Encryption error: $e');
      rethrow;
    }
  }

  static String decryptPayload(String encryptedString) {
    try {
      final parts = encryptedString.split(':');
      if (parts.length != 2) throw Exception('Invalid encrypted payload format');
      
      final iv = IV.fromBase64(parts[0]);
      final encrypted = Encrypted.fromBase64(parts[1]);
      final key = Key.fromUtf8(_keyStr);
      
      final encrypter = Encrypter(AES(key, mode: AESMode.gcm));
      return encrypter.decrypt(encrypted, iv: iv);
    } catch (e) {
      print('Decryption error: $e');
      rethrow;
    }
  }
}
