import '../models/box_models.dart';

class MockData {
  static const List<BoxSize> boxes = [
    BoxSize(id: 'XS', label: 'XS', dims: '20×15×10', dimsCm: [20,15,10], maxKg: 3, volL: 3.0, tare: 0.35, tag: 'small', tagLabel: 'Small'),
    BoxSize(id: 'S', label: 'S', dims: '30×20×15', dimsCm: [30,20,15], maxKg: 5, volL: 9.0, tare: 0.50, tag: 'light', tagLabel: 'Light'),
    BoxSize(id: 'M', label: 'M', dims: '40×30×20', dimsCm: [40,30,20], maxKg: 10, volL: 24.0, tare: 0.70, tag: 'default', tagLabel: 'Default'),
    BoxSize(id: 'L', label: 'L', dims: '50×40×30', dimsCm: [50,40,30], maxKg: 15, volL: 60.0, tare: 0.85, tag: 'large', tagLabel: 'Large'),
    BoxSize(id: 'XL', label: 'XL', dims: '60×50×40', dimsCm: [60,50,40], maxKg: 25, volL: 120.0, tare: 1.10, tag: 'heavy', tagLabel: 'Heavy'),
    BoxSize(id: 'XXL', label: 'XXL', dims: '80×60×50', dimsCm: [80,60,50], maxKg: 40, volL: 240.0, tare: 1.60, tag: 'xheavy', tagLabel: 'Bulk'),
  ];

  static const List<PackItem> items = [
    PackItem(id: 0, name: 'Basmati rice 5 kg', sub: 'heavy · bottom', weight: 5.02, volL: 6.0, layer: 'bottom', fragile: false, crushes: true, leaks: false, glass: false),
    PackItem(id: 1, name: 'Atta flour 10 kg', sub: 'very heavy · bottom', weight: 10.10, volL: 12.0, layer: 'bottom', fragile: false, crushes: true, leaks: false, glass: false),
    PackItem(id: 2, name: 'Toor dal 2 kg ×2', sub: 'medium · mid', weight: 4.06, volL: 5.0, layer: 'middle', fragile: false, crushes: false, leaks: false, glass: false),
    PackItem(id: 3, name: 'Coconut oil 1 L', sub: 'liquid · mid', weight: 0.92, volL: 1.2, layer: 'middle', fragile: false, crushes: false, leaks: true, glass: false),
    PackItem(id: 4, name: 'Biscuit pack ×3', sub: 'fragile · top', weight: 0.54, volL: 2.5, layer: 'top', fragile: true, crushes: false, leaks: false, glass: false),
    PackItem(id: 5, name: 'Glass spice jars ×4', sub: 'glass · top', weight: 0.62, volL: 2.0, layer: 'top', fragile: true, crushes: false, leaks: false, glass: true),
    PackItem(id: 6, name: 'Tamarind 500 g', sub: 'medium · mid', weight: 0.52, volL: 0.8, layer: 'middle', fragile: false, crushes: false, leaks: false, glass: false),
    PackItem(id: 7, name: 'Papad rolls ×2', sub: 'crushable · top', weight: 0.18, volL: 1.5, layer: 'top', fragile: true, crushes: true, leaks: false, glass: false),
  ];
}
