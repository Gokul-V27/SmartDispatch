package com.smartdispatch.controller;

import com.smartdispatch.entity.*;
import com.smartdispatch.repository.*;
import com.smartdispatch.service.VisionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.util.*;

/**
 * AI Vision Controller — handles photo-based product verification.
 *
 * FLOW:
 * 1. Admin uploads reference photo for a product → stored in imageUrls
 * 2. Worker takes photo of physical product on mobile
 * 3. POST /api/vision/compare → backend compares captured vs reference
 * 4. Returns similarity scores: color histogram, perceptual hash, structural, dominant color
 * 5. Overall score >= 70% = PASS, 50-69% = WARN, <50% = FAIL
 *
 * Also:
 * - POST /api/vision/analyze → analyze single image (dominant color, classification)
 * - POST /api/vision/compare-order-item → compare captured photo against order item's product
 */
@RestController
@RequestMapping("/api/vision")
@RequiredArgsConstructor
public class VisionController {

    private final VisionService visionService;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final VerificationLogRepository verificationLogRepository;

    /**
     * Compare a captured photo against a product's reference image.
     * Worker uploads photo → backend loads reference from product.imageUrls → compares both.
     */
    @PostMapping("/compare-order-item")
    public ResponseEntity<?> compareOrderItem(
            @RequestParam("file") MultipartFile file,
            @RequestParam("orderItemId") String orderItemId,
            @RequestParam("workerId") String workerId) {
        try {
            UUID itemId = UUID.fromString(orderItemId);
            UUID wkId = UUID.fromString(workerId);

            var itemOpt = orderItemRepository.findById(itemId);
            if (itemOpt.isEmpty()) return ResponseEntity.notFound().build();

            OrderItem item = itemOpt.get();
            Product product = item.getProduct();

            // Load captured image from upload
            BufferedImage capturedImage = visionService.loadImageFromBytes(file.getBytes());
            if (capturedImage == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not read uploaded image"));
            }

            // Load reference image from product.imageUrls
            BufferedImage referenceImage = null;
            if (product.getImageUrls() != null && !product.getImageUrls().isEmpty()) {
                String firstUrl = product.getImageUrls().split(",")[0].trim();
                referenceImage = visionService.loadImageFromUrl(firstUrl);
            }

            // If no reference image, just analyze the captured image for color
            if (referenceImage == null) {
                var dominantColor = visionService.extractDominantColor(capturedImage);
                String detectedColor = (String) dominantColor.get("colorName");
                boolean colorMatch = product.getColor() == null || product.getColor().isEmpty()
                        || product.getColor().equalsIgnoreCase(detectedColor);

                // Log verification
                VerificationLog log = VerificationLog.builder()
                        .orderId(item.getOrder().getId())
                        .orderItemId(itemId)
                        .workerId(wkId)
                        .step(VerificationLog.VerificationStep.VISION)
                        .result(colorMatch ? VerificationLog.VerificationResult.PASS : VerificationLog.VerificationResult.WARN)
                        .confidence(colorMatch ? 0.8 : 0.4)
                        .build();
                verificationLogRepository.save(log);

                if (colorMatch) {
                    item.setVisionVerified(true);
                    orderItemRepository.save(item);
                }

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("mode", "COLOR_ONLY");
                response.put("message", "No reference image found — color analysis only");
                response.put("result", colorMatch ? "PASS" : "WARN");
                response.put("detectedColor", detectedColor);
                response.put("expectedColor", product.getColor() != null ? product.getColor() : "Any");
                response.put("colorMatch", colorMatch);
                response.put("dominantColor", dominantColor);
                response.put("confidence", colorMatch ? 80 : 40);
                return ResponseEntity.ok(response);
            }

            // Full comparison: reference vs captured
            Map<String, Object> comparison = visionService.compareImages(referenceImage, capturedImage);
            String result = (String) comparison.get("result");

            // Log verification
            double confidence = ((Number) comparison.get("overallScore")).doubleValue();
            VerificationLog log = VerificationLog.builder()
                    .orderId(item.getOrder().getId())
                    .orderItemId(itemId)
                    .workerId(wkId)
                    .step(VerificationLog.VerificationStep.VISION)
                    .result(VerificationLog.VerificationResult.valueOf(result))
                    .confidence(confidence)
                    .build();
            verificationLogRepository.save(log);

            if ("PASS".equals(result)) {
                item.setVisionVerified(true);
                orderItemRepository.save(item);
            }

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("mode", "FULL_COMPARISON");
            response.put("productName", product.getName());
            response.put("productBrand", product.getBrand());
            response.putAll(comparison);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Analyze a single image — returns dominant color, classification.
     * Useful for quick color verification without a reference image.
     */
    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeImage(@RequestParam("file") MultipartFile file) {
        try {
            BufferedImage img = visionService.loadImageFromBytes(file.getBytes());
            if (img == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not read image"));
            }

            var dominantColor = visionService.extractDominantColor(img);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("width", img.getWidth());
            response.put("height", img.getHeight());
            response.put("dominantColor", dominantColor);
            response.put("colorName", dominantColor.get("colorName"));
            response.put("hex", dominantColor.get("hex"));
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Compare two uploaded images directly (no product context).
     * Useful for admin to test comparison quality.
     */
    @PostMapping("/compare")
    public ResponseEntity<?> compareImages(
            @RequestParam("reference") MultipartFile refFile,
            @RequestParam("captured") MultipartFile capFile) {
        try {
            BufferedImage refImg = visionService.loadImageFromBytes(refFile.getBytes());
            BufferedImage capImg = visionService.loadImageFromBytes(capFile.getBytes());

            if (refImg == null || capImg == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not read one or both images"));
            }

            return ResponseEntity.ok(visionService.compareImages(refImg, capImg));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
