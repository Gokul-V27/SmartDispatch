import 'dart:math';
import 'package:flutter/material.dart';

class ColorUtils {
  // --- CIE76 Delta E ---
  static double deltaE76(Color c1, Color c2) {
    var lab1 = rgbToLab(c1.red, c1.green, c1.blue);
    var lab2 = rgbToLab(c2.red, c2.green, c2.blue);
    return sqrt(pow(lab1[0] - lab2[0], 2) + pow(lab1[1] - lab2[1], 2) + pow(lab1[2] - lab2[2], 2));
  }

  // --- RGB to CIELAB ---
  static List<double> rgbToLab(int r, int g, int b) {
    double rLinear = _pivotRgb(r / 255.0);
    double gLinear = _pivotRgb(g / 255.0);
    double bLinear = _pivotRgb(b / 255.0);

    // Observer. = 2°, Illuminant = D65
    double x = rLinear * 0.4124 + gLinear * 0.3576 + bLinear * 0.1805;
    double y = rLinear * 0.2126 + gLinear * 0.7152 + bLinear * 0.0722;
    double z = rLinear * 0.0193 + gLinear * 0.1192 + bLinear * 0.9505;

    x = _pivotXyz(x / 0.95047);
    y = _pivotXyz(y / 1.00000);
    z = _pivotXyz(z / 1.08883);

    double l = max(0, 116 * y - 16);
    double a = 500 * (x - y);
    double bVal = 200 * (y - z);

    return [l, a, bVal];
  }

  static double _pivotRgb(double n) {
    return (n > 0.04045) ? pow((n + 0.055) / 1.055, 2.4).toDouble() : n / 12.92;
  }

  static double _pivotXyz(double n) {
    return (n > 0.008856) ? pow(n, 1.0 / 3.0).toDouble() : (7.787 * n) + (16.0 / 116.0);
  }

  // --- K-Means Clustering for Dominant Color ---
  // A simplified K-Means for extracting dominant color from a subset of RGB pixels.
  // Pixels is a flat list [r,g,b,r,g,b,...]
  static Color kMeansDominantColor(List<int> pixels, int k, {int maxIter = 10}) {
    if (pixels.isEmpty) return Colors.black;
    final random = Random();
    int pixelCount = pixels.length ~/ 3;
    
    // Initialize centroids randomly from existing pixels
    List<List<int>> centroids = [];
    for (int i = 0; i < k; i++) {
      int idx = random.nextInt(pixelCount) * 3;
      centroids.add([pixels[idx], pixels[idx+1], pixels[idx+2]]);
    }

    List<int> assignments = List.filled(pixelCount, 0);
    
    for (int iter = 0; iter < maxIter; iter++) {
      bool changed = false;
      
      // Assign pixels to nearest centroid
      for (int i = 0; i < pixelCount; i++) {
        int r = pixels[i * 3];
        int g = pixels[i * 3 + 1];
        int b = pixels[i * 3 + 2];
        
        int bestC = 0;
        int bestDist = 99999999;
        for (int c = 0; c < k; c++) {
          int dr = r - centroids[c][0];
          int dg = g - centroids[c][1];
          int db = b - centroids[c][2];
          int dist = dr*dr + dg*dg + db*db;
          if (dist < bestDist) {
            bestDist = dist;
            bestC = c;
          }
        }
        if (assignments[i] != bestC) {
          assignments[i] = bestC;
          changed = true;
        }
      }
      
      if (!changed) break;
      
      // Update centroids
      List<int> counts = List.filled(k, 0);
      List<int> sumsR = List.filled(k, 0);
      List<int> sumsG = List.filled(k, 0);
      List<int> sumsB = List.filled(k, 0);
      
      for (int i = 0; i < pixelCount; i++) {
        int c = assignments[i];
        counts[c]++;
        sumsR[c] += pixels[i * 3];
        sumsG[c] += pixels[i * 3 + 1];
        sumsB[c] += pixels[i * 3 + 2];
      }
      
      for (int c = 0; c < k; c++) {
        if (counts[c] > 0) {
          centroids[c] = [
            sumsR[c] ~/ counts[c],
            sumsG[c] ~/ counts[c],
            sumsB[c] ~/ counts[c],
          ];
        }
      }
    }

    // Find the centroid with the most pixels assigned
    List<int> counts = List.filled(k, 0);
    for (int i = 0; i < pixelCount; i++) counts[assignments[i]]++;
    
    int maxCount = 0;
    int dominantC = 0;
    for (int c = 0; c < k; c++) {
      if (counts[c] > maxCount) {
        maxCount = counts[c];
        dominantC = c;
      }
    }

    return Color.fromARGB(
      255, 
      centroids[dominantC][0], 
      centroids[dominantC][1], 
      centroids[dominantC][2]
    );
  }

  // Parses typical color names or hex strings into Flutter Colors
  static Color parseColor(String? colorString) {
    if (colorString == null || colorString.isEmpty) return Colors.grey;
    final map = {
      'silver': const Color(0xFFC0C0C0),
      'black': Colors.black,
      'blue': Colors.blue,
      'orange': Colors.orange,
      'green': Colors.green,
      'red': Colors.red,
      'white': Colors.white,
      'yellow': Colors.yellow,
    };
    final lower = colorString.toLowerCase();
    if (map.containsKey(lower)) return map[lower]!;
    
    if (lower.startsWith('#') && lower.length >= 7) {
      try {
        return Color(int.parse(lower.substring(1, 7), radix: 16) + 0xFF000000);
      } catch (_) {}
    }
    return Colors.grey;
  }
}
