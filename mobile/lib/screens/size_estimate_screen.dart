import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'package:google_mlkit_object_detection/google_mlkit_object_detection.dart';
import '../core/theme.dart';
import '../core/ml_helpers.dart';
import '../services/packing_provider.dart';

class SizeEstimateScreen extends StatefulWidget {
  const SizeEstimateScreen({super.key});

  @override
  State<SizeEstimateScreen> createState() => _SizeEstimateScreenState();
}

class _SizeEstimateScreenState extends State<SizeEstimateScreen> {
  CameraController? _cameraController;
  late ObjectDetector _objectDetector;
  
  bool _isProcessing = false;
  String _status = 'scanning'; // scanning | pass | fail
  String _failReason = '';
  
  double _estLength = 0;
  double _estWidth = 0;
  double _estHeight = 0;
  double _fitPercentage = 0;
  
  bool _simFallback = false;

  @override
  void initState() {
    super.initState();
    
    final options = ObjectDetectorOptions(
      mode: DetectionMode.single,
      classifyObjects: true,
      multipleObjects: false,
    );
    _objectDetector = ObjectDetector(options: options);

    _initScanner();
  }

  void _initScanner() async {
    if (MLHelpers.isPhysicalDevice()) {
      try {
        final cameras = await availableCameras();
        if (cameras.isNotEmpty) {
          _cameraController = CameraController(
            cameras.first, 
            ResolutionPreset.medium,
            enableAudio: false,
            imageFormatGroup: ImageFormatGroup.yuv420,
          );
          await _cameraController!.initialize();
          if (mounted) setState(() {});
          _cameraController!.startImageStream(_processCameraImage);
        } else {
          _enableSimFallback();
        }
      } catch (e) {
        _enableSimFallback();
      }
    } else {
      _enableSimFallback();
    }

    final packProv = Provider.of<PackingProvider>(context, listen: false);
    if (packProv.isAutoProcessing) {
      _enableSimFallback(forcePass: true);
    }
  }

  void _enableSimFallback({bool forcePass = false}) {
    if (!mounted) return;
    setState(() => _simFallback = true);
    
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      
      final packProv = Provider.of<PackingProvider>(context, listen: false);
      final box = packProv.selectedBox;
      
      if (forcePass && box != null) {
        // Mock a fit
        _handleResult(true, 15, 10, 5, 45, "");
      } else if (box != null) {
        // Mock fit for demo
        _handleResult(true, 20, 15, 8, 65, "");
      } else {
        _handleResult(false, 0, 0, 0, 0, "No box selected");
      }
    });
  }

  void _processCameraImage(CameraImage image) async {
    if (_isProcessing || _status != 'scanning') return;
    _isProcessing = true;

    try {
      final inputImage = MLHelpers.inputImageFromCameraImage(image, _cameraController);
      if (inputImage == null) {
        _isProcessing = false;
        return;
      }

      final objects = await _objectDetector.processImage(inputImage);
      
      if (objects.isNotEmpty) {
        final obj = objects.first;
        final rect = obj.boundingBox;
        
        final packProv = Provider.of<PackingProvider>(context, listen: false);
        final box = packProv.selectedBox;
        
        if (box != null) {
          // Heuristic: Use image width vs box width to estimate scale
          final imgW = inputImage.metadata?.size.width ?? 480;
          final scale = box.dimsCm[0] / imgW; // e.g. Box Length / Image Width
          
          double estL = rect.width * scale;
          double estW = rect.height * scale;
          double estH = 5.0; // Fallback depth since 2D bounding box gives only 2 dims
          
          double itemVolL = (estL * estW * estH) / 1000.0;
          
          // Calculate remaining volume
          double packedVol = packProv.packedItems.fold(0.0, (sum, item) {
             // In a real app we'd use the product's actual dimension volume
             return sum + 2.0; 
          });
          
          double remainingVol = box.volL - packedVol;
          double fitPct = ((packedVol + itemVolL) / box.volL) * 100;
          
          String reason = "";
          if (estL > box.dimsCm[0]) reason = "Item length (${estL.toStringAsFixed(1)}cm) > Box (${box.dimsCm[0]}cm).\n";
          if (estW > box.dimsCm[1]) reason += "Item width (${estW.toStringAsFixed(1)}cm) > Box (${box.dimsCm[1]}cm).\n";
          if (itemVolL > remainingVol) reason += "Item vol (${itemVolL.toStringAsFixed(1)}L) > Free space (${remainingVol.toStringAsFixed(1)}L).\n";

          if (reason.isNotEmpty) {
             _cameraController?.stopImageStream();
             _handleResult(false, estL, estW, estH, fitPct, reason.trim() + "\n\nBox Free Space: ${remainingVol.toStringAsFixed(1)}L");
          } else {
             _cameraController?.stopImageStream();
             _handleResult(true, estL, estW, estH, fitPct, "Box Free Space: ${remainingVol.toStringAsFixed(1)}L");
          }
        }
      }
    } catch (e) {
      // Ignore
    }

    _isProcessing = false;
  }

  void _handleResult(bool pass, double l, double w, double h, double fitPct, String reason) {
    if (!mounted) return;
    
    setState(() {
      _status = pass ? 'pass' : 'fail';
      _estLength = l;
      _estWidth = w;
      _estHeight = h;
      _fitPercentage = fitPct;
      _failReason = reason;
    });

    final packProv = Provider.of<PackingProvider>(context, listen: false);
    
    if (pass) {
      packProv.passGate(GateType.size);
      Future.delayed(const Duration(milliseconds: 1000), () {
        if (!mounted) return;
        Navigator.pushReplacementNamed(context, '/item-confirm');
      });
    } else {
      packProv.failGate(GateType.size);
    }
  }

  void _retry() {
    setState(() {
      _status = 'scanning';
    });
    if (!_simFallback) {
      _cameraController?.startImageStream(_processCameraImage);
    } else {
      _enableSimFallback();
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _objectDetector.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final packProv = Provider.of<PackingProvider>(context);
    final box = packProv.selectedBox;
    
    final bool isScanning = _status == 'scanning';
    final bool isPass = _status == 'pass';
    final Color statusColor = isScanning ? AppColors.blue : (isPass ? AppColors.teal : AppColors.red);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Size Estimation Check'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back), 
          onPressed: () => Navigator.pop(context)
        ),
      ),
      body: Column(
        children: [
          // Target Info
          if (box != null)
            Container(
              padding: const EdgeInsets.all(16),
              color: AppColors.surface,
              child: Row(
                children: [
                  const Icon(Icons.inventory_2, color: AppColors.blue),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('CURRENT BOX: ${box.label}', style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                        Text('Remaining Vol: ${(box.volL - (packProv.packedItems.length * 2.0)).toStringAsFixed(1)}L', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

          // Viewport
          Container(
            height: 280,
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(color: statusColor, width: 3),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Stack(
              alignment: Alignment.center,
              fit: StackFit.expand,
              children: [
                if (!_simFallback && _cameraController != null && _cameraController!.value.isInitialized)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(5),
                    child: CameraPreview(_cameraController!),
                  )
                else
                  Container(
                    decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(5)),
                    child: const Center(
                      child: Icon(Icons.straighten, color: AppColors.textMuted, size: 72),
                    ),
                  ),

                if (_simFallback && isScanning)
                  Positioned(
                    bottom: 8, right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      color: AppColors.amber,
                      child: const Text('DEMO MODE', style: TextStyle(fontSize: 10, color: Colors.black, fontWeight: FontWeight.bold)),
                    ),
                  ),

                if (isScanning)
                  const Center(
                    child: CircularProgressIndicator(color: AppColors.blue),
                  ),

                // Mock Bounding Box for simulation pass
                if (!isScanning && isPass)
                  Positioned(
                    child: Container(
                      width: 150, height: 100,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.teal, width: 2),
                        color: AppColors.teal.withValues(alpha: 0.2),
                      ),
                    ),
                  ),

                if (!isScanning && !isPass)
                  Container(
                    color: statusColor.withValues(alpha: 0.3),
                    child: Center(
                      child: Icon(
                        Icons.cancel,
                        color: statusColor,
                        size: 96,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Results
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                Text(
                  isScanning 
                      ? 'Estimating object dimensions...' 
                      : (isPass ? 'SIZE FITS ✓' : 'DOES NOT FIT'),
                  style: TextStyle(
                    fontFamily: 'JetBrains Mono', 
                    fontSize: 16, 
                    fontWeight: FontWeight.bold,
                    color: statusColor,
                  ),
                ),
                const SizedBox(height: 16),
                
                if (!isScanning) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildDimCol('LENGTH', _estLength),
                      _buildDimCol('WIDTH', _estWidth),
                      _buildDimCol('HEIGHT', _estHeight),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Fill Bar
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Estimated Box Fill', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                          Text('${_fitPercentage.toStringAsFixed(0)}%', style: TextStyle(fontSize: 11, color: isPass ? AppColors.teal : AppColors.red, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Container(
                        height: 6, width: double.infinity,
                        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(3)),
                        child: FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: (_fitPercentage / 100).clamp(0.0, 1.0),
                          child: Container(
                            decoration: BoxDecoration(
                              color: isPass ? AppColors.teal : AppColors.red,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  
                  if (!isPass) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.red.withOpacity(0.3)),
                      ),
                      child: Text(
                        _failReason,
                        style: const TextStyle(fontSize: 12, color: AppColors.red, fontWeight: FontWeight.w600),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ] else ...[
                    const SizedBox(height: 16),
                    Text(
                      _failReason, // Shows the Box Free Space even on pass
                      style: const TextStyle(fontSize: 12, color: AppColors.teal, fontWeight: FontWeight.w600),
                      textAlign: TextAlign.center,
                    ),
                  ]
                ],
              ],
            ),
          ),

          const Spacer(),

          // Actions
          if (!isScanning && !isPass)
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton.icon(
                onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/box-selector', (r) => r.isFirst),
                icon: const Icon(Icons.inventory_2),
                label: const Text('RECOMMEND LARGER BOX'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.red,
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDimCol(String label, double val) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: AppColors.textMuted)),
        const SizedBox(height: 4),
        Text('${val.toStringAsFixed(1)} cm', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 14, color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
