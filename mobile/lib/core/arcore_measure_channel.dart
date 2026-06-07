import 'package:flutter/services.dart';

/// Result from ARCore depth measurement.
class ArMeasureResult {
  final double lengthCm;
  final double widthCm;
  final double heightCm;
  final bool isValid;
  final String? error;

  const ArMeasureResult({
    required this.lengthCm,
    required this.widthCm,
    required this.heightCm,
    required this.isValid,
    this.error,
  });

  double get volumeL => (lengthCm * widthCm * heightCm) / 1000.0;

  factory ArMeasureResult.invalid(String reason) =>
      ArMeasureResult(lengthCm: 0, widthCm: 0, heightCm: 0, isValid: false, error: reason);
}

/// Flutter ↔ Kotlin bridge for ARCore Depth API measurements.
///
/// Usage:
///   final channel = ArCoreMeasureChannel();
///   await channel.init();
///   final result = await channel.measure(
///     bbX1: 100, bbY1: 80, bbX2: 340, bbY2: 290,
///     imageWidth: 480, imageHeight: 640,
///   );
///   await channel.dispose();
class ArCoreMeasureChannel {
  static const _ch = MethodChannel('com.smartdispatch.smartdispatch_mobile/arcore_measure');

  /// Check if ARCore is supported on this device without initializing a session.
  Future<bool> checkSupported() async {
    try {
      return await _ch.invokeMethod<bool>('checkSupported') ?? false;
    } on PlatformException {
      return false;
    }
  }

  /// Initialise the ARCore session on the native side.
  /// Returns true if ARCore + Depth API is supported on this device.
  Future<bool> init() async {
    try {
      final supported = await _ch.invokeMethod<bool>('init') ?? false;
      return supported;
    } on PlatformException {
      return false;
    }
  }

  /// Capture a depth frame and measure the object inside the given
  /// bounding box (in camera-image pixel coordinates).
  ///
  /// [bbX1],[bbY1] = top-left corner of bounding box
  /// [bbX2],[bbY2] = bottom-right corner of bounding box
  /// [imageWidth],[imageHeight] = full camera image resolution
  Future<ArMeasureResult> measure({
    required int bbX1,
    required int bbY1,
    required int bbX2,
    required int bbY2,
    required int imageWidth,
    required int imageHeight,
  }) async {
    try {
      final Map<dynamic, dynamic>? raw = await _ch.invokeMethod('measure', {
        'bbX1': bbX1,
        'bbY1': bbY1,
        'bbX2': bbX2,
        'bbY2': bbY2,
        'imageWidth': imageWidth,
        'imageHeight': imageHeight,
      });

      if (raw == null) return ArMeasureResult.invalid('No result from native');

      if (raw.containsKey('error')) {
        return ArMeasureResult.invalid(raw['error'] as String);
      }

      return ArMeasureResult(
        lengthCm: (raw['length'] as num).toDouble(),
        widthCm:  (raw['width']  as num).toDouble(),
        heightCm: (raw['height'] as num).toDouble(),
        isValid: true,
      );
    } on PlatformException catch (e) {
      return ArMeasureResult.invalid(e.message ?? 'Platform error');
    }
  }

  /// Release the ARCore session. Call in dispose().
  Future<void> dispose() async {
    try {
      await _ch.invokeMethod('dispose');
    } on PlatformException {
      // Ignore – already disposed or unavailable
    }
  }
}
