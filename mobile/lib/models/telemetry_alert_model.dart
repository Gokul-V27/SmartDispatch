/// Telemetry alert for weight alarms and sensor failures
class TelemetryAlert {
  final String id;
  final String severity; // CRITICAL, WARNING, INFO
  final String alertType; // WEIGHT_FAIL, OCR_FAIL, VISION_FAIL
  final String orderId;
  final String orderNumber;
  final String workerName;
  final String detail;
  bool isResolved;
  final String createdAt;

  TelemetryAlert({
    required this.id,
    required this.severity,
    required this.alertType,
    required this.orderId,
    required this.orderNumber,
    required this.workerName,
    required this.detail,
    this.isResolved = false,
    required this.createdAt,
  });
}
