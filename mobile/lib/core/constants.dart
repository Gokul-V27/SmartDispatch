import 'package:flutter/material.dart';

class AppConstants {
  static const String apiUrl = 'http://192.168.0.109:8080/api'; // Mock endpoint
  
  // Layer colors from spec
  static const Map<String, Map<String, dynamic>> layerColors = {
    'bottom': {'bg': Color(0xFFE6F1FB), 'color': Color(0xFF0C447C), 'lbl': 'bottom'},
    'middle': {'bg': Color(0xFFEAF3DE), 'color': Color(0xFF27500A), 'lbl': 'mid'},
    'top': {'bg': Color(0xFFEEEDFE), 'color': Color(0xFF3C3489), 'lbl': 'top'},
  };

  // Box tag colors
  static const Map<String, Map<String, Color>> tagColors = {
    'small': {'bg': Color(0xFFEEEDFE), 'text': Color(0xFF3C3489)},
    'light': {'bg': Color(0xFFE6F1FB), 'text': Color(0xFF0C447C)},
    'default': {'bg': Color(0xFFEAF3DE), 'text': Color(0xFF27500A)},
    'large': {'bg': Color(0xFFFAEEDA), 'text': Color(0xFF633806)},
    'heavy': {'bg': Color(0xFFFAEEDA), 'text': Color(0xFF633806)},
    'xheavy': {'bg': Color(0xFFFCEBEB), 'text': Color(0xFF791F1F)},
  };
}
