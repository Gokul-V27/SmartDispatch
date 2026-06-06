/// Worker model for packer identity selection
class Worker {
  final String id;
  final String name;
  final String workerId;
  final String pin;
  final String role;
  final bool isOnline;

  const Worker({
    required this.id,
    required this.name,
    required this.workerId,
    this.pin = '1234',
    this.role = 'packer',
    this.isOnline = true,
  });
}
