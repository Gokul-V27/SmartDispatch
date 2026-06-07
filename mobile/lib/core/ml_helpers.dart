import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:camera/camera.dart';
import 'package:flutter/services.dart';
import 'package:google_mlkit_commons/google_mlkit_commons.dart';
import 'package:path_provider/path_provider.dart';

class MLHelpers {
  /// Checks if running on a real physical device
  static bool isPhysicalDevice() {
    if (kIsWeb) return false;
    return true; // Let availableCameras() determine if a camera actually exists
  }

  /// Converts a camera stream image into ML Kit InputImage format
  static InputImage? inputImageFromCameraImage(
    CameraImage image,
    CameraController? controller,
  ) {
    if (controller == null || !controller.value.isInitialized) return null;

    final sensorOrientation = controller.description.sensorOrientation;
    InputImageRotation? rotation;
    if (Platform.isIOS) {
      rotation = InputImageRotationValue.fromRawValue(sensorOrientation);
    } else if (Platform.isAndroid) {
      var rotationCompensation = 0; // fallback
      rotation = InputImageRotationValue.fromRawValue(sensorOrientation);
    }

    if (rotation == null) return null;

    final format = InputImageFormatValue.fromRawValue(image.format.raw);
    
    // ML Kit only supports Nv21 or Yuv420888 on Android, and Bgra8888 on iOS
    if (format == null ||
        (Platform.isAndroid && format != InputImageFormat.nv21 && format != InputImageFormat.yuv420) ||
        (Platform.isIOS && format != InputImageFormat.bgra8888)) {
      return null;
    }

    if (image.planes.isEmpty) return null;

    final WriteBuffer allBytes = WriteBuffer();
    for (final Plane plane in image.planes) {
      allBytes.putUint8List(plane.bytes);
    }
    final bytes = allBytes.done().buffer.asUint8List();

    return InputImage.fromBytes(
      bytes: bytes,
      metadata: InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format: format,
        bytesPerRow: image.planes[0].bytesPerRow,
      ),
    );
  }

  /// Converts mobile_scanner JPEG bytes into ML Kit InputImage format
  static Future<InputImage?> inputImageFromMobileScanner(Uint8List imageBytes) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/temp_ocr_frame.jpg');
      await file.writeAsBytes(imageBytes);
      return InputImage.fromFilePath(file.path);
    } catch (e) {
      return null;
    }
  }

  /// Fuzzy match ML Kit labels to a product category
  static bool categoryMatches(List<String> labels, String expectedCategory) {
    if (labels.isEmpty) return false;
    final cat = expectedCategory.toLowerCase();
    
    // Simple taxonomy mapping for the demo
    final taxonomy = {
      'electronics': ['laptop', 'computer', 'mouse', 'phone', 'device', 'electronic', 'screen'],
      'clothing': ['clothing', 'shirt', 'jacket', 'pants', 'fabric', 'apparel'],
      'grocery': ['food', 'rice', 'bottle', 'liquid', 'snack', 'jar', 'container'],
      'furniture': ['chair', 'seat', 'furniture', 'wood', 'leather'],
      'hardware': ['tool', 'box', 'metal', 'equipment'],
    };

    final allowedKeywords = taxonomy[cat] ?? [cat];

    for (var label in labels) {
      final l = label.toLowerCase();
      for (var kw in allowedKeywords) {
        if (l.contains(kw) || kw.contains(l)) return true;
      }
    }
    
    return false;
  }
}
