class BoxSize {
  final String id;
  final String label;
  final String dims;
  final List<int> dimsCm;
  final double maxKg;
  final double volL;
  final double tare;
  final String tag;
  final String tagLabel;

  const BoxSize({
    required this.id,
    required this.label,
    required this.dims,
    required this.dimsCm,
    required this.maxKg,
    required this.volL,
    required this.tare,
    required this.tag,
    required this.tagLabel,
  });
}

class PackItem {
  final int id;
  final String name;
  final String sub;
  final double weight;
  final double volL;
  final String layer;
  final bool fragile;
  final bool crushes;
  final bool leaks;
  final bool glass;

  const PackItem({
    required this.id,
    required this.name,
    required this.sub,
    required this.weight,
    required this.volL,
    required this.layer,
    required this.fragile,
    required this.crushes,
    required this.leaks,
    required this.glass,
  });
}
