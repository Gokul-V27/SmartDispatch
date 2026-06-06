package com.smartdispatch.controller;

import com.smartdispatch.entity.*;
import com.smartdispatch.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/verify")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationLogRepository verificationLogRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;

    @PostMapping("/ocr")
    public ResponseEntity<?> verifyOcr(@RequestBody Map<String, Object> body) {
        UUID orderItemId = UUID.fromString((String) body.get("orderItemId"));
        UUID workerId = UUID.fromString((String) body.get("workerId"));
        String scannedBrand = (String) body.getOrDefault("scannedBrand", "");
        String scannedSku = (String) body.getOrDefault("scannedSku", "");

        var itemOpt = orderItemRepository.findById(orderItemId);
        if (itemOpt.isEmpty()) return ResponseEntity.notFound().build();

        OrderItem item = itemOpt.get();
        Product product = item.getProduct();

        boolean brandMatch = product.getBrand().equalsIgnoreCase(scannedBrand.trim());
        boolean skuMatch = product.getSku().equalsIgnoreCase(scannedSku.trim());
        boolean allMatch = brandMatch && skuMatch;

        VerificationLog log = VerificationLog.builder()
                .orderId(item.getOrder().getId()).orderItemId(orderItemId).workerId(workerId)
                .step(VerificationLog.VerificationStep.OCR)
                .result(allMatch ? VerificationLog.VerificationResult.PASS : VerificationLog.VerificationResult.FAIL)
                .scannedData("{\"brand\":\"" + scannedBrand + "\",\"sku\":\"" + scannedSku + "\"}")
                .expectedData("{\"brand\":\"" + product.getBrand() + "\",\"sku\":\"" + product.getSku() + "\"}")
                .build();
        verificationLogRepository.save(log);

        if (allMatch) { item.setOcrVerified(true); orderItemRepository.save(item); }

        return ResponseEntity.ok(Map.of("result", allMatch ? "PASS" : "FAIL",
                "brandMatch", brandMatch, "skuMatch", skuMatch,
                "expected", Map.of("brand", product.getBrand(), "sku", product.getSku()),
                "scanned", Map.of("brand", scannedBrand, "sku", scannedSku)));
    }

    @PostMapping("/vision")
    public ResponseEntity<?> verifyVision(@RequestBody Map<String, Object> body) {
        UUID orderItemId = UUID.fromString((String) body.get("orderItemId"));
        UUID workerId = UUID.fromString((String) body.get("workerId"));
        String detectedColor = (String) body.getOrDefault("detectedColor", "");
        Double confidence = body.get("confidence") != null ? ((Number) body.get("confidence")).doubleValue() : 0.0;

        var itemOpt = orderItemRepository.findById(orderItemId);
        if (itemOpt.isEmpty()) return ResponseEntity.notFound().build();

        OrderItem item = itemOpt.get();
        Product product = item.getProduct();
        boolean colorMatch = product.getColor() == null || product.getColor().equalsIgnoreCase(detectedColor.trim());
        boolean pass = colorMatch && confidence >= 0.7;

        VerificationLog log = VerificationLog.builder()
                .orderId(item.getOrder().getId()).orderItemId(orderItemId).workerId(workerId)
                .step(VerificationLog.VerificationStep.VISION)
                .result(pass ? VerificationLog.VerificationResult.PASS : VerificationLog.VerificationResult.FAIL)
                .confidence(confidence).build();
        verificationLogRepository.save(log);

        if (pass) { item.setVisionVerified(true); orderItemRepository.save(item); }

        return ResponseEntity.ok(Map.of("result", pass ? "PASS" : "FAIL",
                "colorMatch", colorMatch, "confidence", confidence));
    }

    @PostMapping("/weight")
    public ResponseEntity<?> verifyWeight(@RequestBody Map<String, Object> body) {
        UUID orderItemId = UUID.fromString((String) body.get("orderItemId"));
        UUID workerId = UUID.fromString((String) body.get("workerId"));
        Double measured = ((Number) body.get("measuredWeight")).doubleValue();

        var itemOpt = orderItemRepository.findById(orderItemId);
        if (itemOpt.isEmpty()) return ResponseEntity.notFound().build();

        OrderItem item = itemOpt.get();
        Product product = item.getProduct();
        double expected = product.getWeightKg() != null ? product.getWeightKg() * item.getQuantity() : 0;
        double tolKg = (product.getWeightToleranceG() != null ? product.getWeightToleranceG() : 100) / 1000.0;
        double delta = Math.abs(measured - expected);
        String result = delta <= tolKg ? "PASS" : (delta <= tolKg * 2 ? "WARN" : "FAIL");

        VerificationLog log = VerificationLog.builder()
                .orderId(item.getOrder().getId()).orderItemId(orderItemId).workerId(workerId)
                .step(VerificationLog.VerificationStep.WEIGHT)
                .result(VerificationLog.VerificationResult.valueOf(result)).build();
        verificationLogRepository.save(log);

        if ("PASS".equals(result)) { item.setWeightVerified(true); orderItemRepository.save(item); }

        return ResponseEntity.ok(Map.of("result", result, "measured", measured,
                "expected", expected, "deltaKg", delta, "toleranceKg", tolKg));
    }

    /**
     * COMBINED SCAN-VERIFY: Worker scans barcode/QR on product.
     * Backend auto-fetches product details, compares with order, checks weight from DB.
     * No manual input required — everything automated from one barcode scan.
     *
     * Input:  { scannedSku, orderItemId, workerId }
     * Output: Full comparison result with expected vs scanned details
     */
    @PostMapping("/scan-verify")
    public ResponseEntity<?> scanAndVerify(@RequestBody Map<String, Object> body) {
        String scannedSku = (String) body.getOrDefault("scannedSku", "");
        UUID orderItemId = UUID.fromString((String) body.get("orderItemId"));
        UUID workerId = UUID.fromString((String) body.get("workerId"));

        var itemOpt = orderItemRepository.findById(orderItemId);
        if (itemOpt.isEmpty()) return ResponseEntity.notFound().build();

        OrderItem item = itemOpt.get();
        Product expectedProduct = item.getProduct();

        // Step 1: SKU match
        boolean skuMatch = expectedProduct.getSku().equalsIgnoreCase(scannedSku.trim());

        // Step 2: Lookup the scanned product to get its full details
        var scannedProductOpt = productRepository.findBySku(scannedSku.trim());
        Product scannedProduct = scannedProductOpt.orElse(null);

        boolean brandMatch = false;
        boolean colorMatch = false;
        boolean weightMatch = false;
        String weightResult = "SKIP";
        double expectedWeight = 0;
        double scannedWeight = 0;
        double weightDelta = 0;
        double toleranceKg = 0;

        if (scannedProduct != null) {
            brandMatch = expectedProduct.getBrand().equalsIgnoreCase(scannedProduct.getBrand());
            colorMatch = expectedProduct.getColor() == null || expectedProduct.getColor().isEmpty()
                    || expectedProduct.getColor().equalsIgnoreCase(scannedProduct.getColor());

            // Auto weight comparison from DB (no manual entry)
            if (expectedProduct.getWeightKg() != null && scannedProduct.getWeightKg() != null) {
                expectedWeight = expectedProduct.getWeightKg() * item.getQuantity();
                scannedWeight = scannedProduct.getWeightKg() * item.getQuantity();
                toleranceKg = (expectedProduct.getWeightToleranceG() != null ? expectedProduct.getWeightToleranceG() : 100) / 1000.0;
                weightDelta = Math.abs(scannedWeight - expectedWeight);
                weightMatch = weightDelta <= toleranceKg;
                weightResult = weightDelta <= toleranceKg ? "PASS" : (weightDelta <= toleranceKg * 2 ? "WARN" : "FAIL");
            }
        }

        boolean allPass = skuMatch && brandMatch && colorMatch && (weightMatch || weightResult.equals("SKIP"));
        String overallResult = allPass ? "PASS" : "FAIL";

        // Log OCR verification
        VerificationLog ocrLog = VerificationLog.builder()
                .orderId(item.getOrder().getId()).orderItemId(orderItemId).workerId(workerId)
                .step(VerificationLog.VerificationStep.OCR)
                .result(skuMatch && brandMatch ? VerificationLog.VerificationResult.PASS : VerificationLog.VerificationResult.FAIL)
                .scannedData("{\"sku\":\"" + scannedSku + "\"}")
                .expectedData("{\"sku\":\"" + expectedProduct.getSku() + "\"}")
                .build();
        verificationLogRepository.save(ocrLog);

        // Log weight verification if applicable
        if (!weightResult.equals("SKIP")) {
            VerificationLog weightLog = VerificationLog.builder()
                    .orderId(item.getOrder().getId()).orderItemId(orderItemId).workerId(workerId)
                    .step(VerificationLog.VerificationStep.WEIGHT)
                    .result(VerificationLog.VerificationResult.valueOf(weightResult))
                    .build();
            verificationLogRepository.save(weightLog);
            if (weightMatch) { item.setWeightVerified(true); }
        }

        if (skuMatch && brandMatch) { item.setOcrVerified(true); }
        if (allPass) { item.setVisionVerified(true); }
        orderItemRepository.save(item);

        // Build comprehensive response
        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("result", overallResult);
        response.put("skuMatch", skuMatch);
        response.put("brandMatch", brandMatch);
        response.put("colorMatch", colorMatch);
        response.put("weightResult", weightResult);
        response.put("expected", Map.of(
                "name", expectedProduct.getName(),
                "brand", expectedProduct.getBrand(),
                "sku", expectedProduct.getSku(),
                "color", expectedProduct.getColor() != null ? expectedProduct.getColor() : "",
                "weightKg", expectedProduct.getWeightKg() != null ? expectedProduct.getWeightKg() : 0,
                "category", expectedProduct.getCategory()
        ));
        if (scannedProduct != null) {
            response.put("scanned", Map.of(
                    "name", scannedProduct.getName(),
                    "brand", scannedProduct.getBrand(),
                    "sku", scannedProduct.getSku(),
                    "color", scannedProduct.getColor() != null ? scannedProduct.getColor() : "",
                    "weightKg", scannedProduct.getWeightKg() != null ? scannedProduct.getWeightKg() : 0,
                    "category", scannedProduct.getCategory()
            ));
        } else {
            response.put("scanned", Map.of("sku", scannedSku, "error", "Product not found in database"));
        }
        response.put("weight", Map.of(
                "expected", expectedWeight, "actual", scannedWeight,
                "delta", weightDelta, "tolerance", toleranceKg, "result", weightResult
        ));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs/{orderId}")
    public ResponseEntity<?> getLogs(@PathVariable UUID orderId) {
        return ResponseEntity.ok(verificationLogRepository.findByOrderId(orderId));
    }
}
