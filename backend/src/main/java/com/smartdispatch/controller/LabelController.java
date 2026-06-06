package com.smartdispatch.controller;

import com.smartdispatch.entity.Order;
import com.smartdispatch.repository.OrderItemRepository;
import com.smartdispatch.repository.OrderRepository;
import com.smartdispatch.service.BarcodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Label & barcode generation endpoints.
 * 
 * GET /api/label/{orderId}/barcode     → barcode PNG (Code128)
 * GET /api/label/{orderId}/qr          → QR code PNG (tracking URL)
 * GET /api/label/{orderId}/full        → complete dispatch label PNG
 * GET /api/label/{orderId}/data        → JSON with base64 barcode + QR
 */
@RestController
@RequestMapping("/api/label")
@RequiredArgsConstructor
public class LabelController {

    private final BarcodeService barcodeService;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @GetMapping("/{orderId}/barcode")
    public ResponseEntity<byte[]> getBarcode(@PathVariable UUID orderId) {
        return orderRepository.findById(orderId).map(order -> {
            try {
                byte[] png = barcodeService.generateBarcode(order.getOrderNumber(), 400, 80);
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_PNG)
                        .header("Content-Disposition", "inline; filename=barcode-" + order.getOrderNumber() + ".png")
                        .body(png);
            } catch (Exception e) {
                return ResponseEntity.status(500).body((byte[]) null);
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{orderId}/qr")
    public ResponseEntity<byte[]> getQrCode(@PathVariable UUID orderId) {
        return orderRepository.findById(orderId).map(order -> {
            try {
                byte[] png = barcodeService.generateQrCode(order.getOrderNumber(), 300);
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_PNG)
                        .header("Content-Disposition", "inline; filename=qr-" + order.getOrderNumber() + ".png")
                        .body(png);
            } catch (Exception e) {
                return ResponseEntity.status(500).body((byte[]) null);
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{orderId}/full")
    public ResponseEntity<byte[]> getFullLabel(@PathVariable UUID orderId) {
        return orderRepository.findById(orderId).map(order -> {
            try {
                String customerName = order.getCustomer().getName();
                String address = order.getShippingAddress() != null ? order.getShippingAddress() : "No address";
                
                var items = orderItemRepository.findByOrderId(orderId);
                String itemSummary = items.stream()
                        .map(i -> i.getQuantity() + "x " + i.getProduct().getName() + " (" + i.getProduct().getSku() + ")")
                        .collect(Collectors.joining("\n"));

                byte[] png = barcodeService.generateLabelImage(
                        order.getOrderNumber(), customerName, address, itemSummary);
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_PNG)
                        .header("Content-Disposition", "inline; filename=label-" + order.getOrderNumber() + ".png")
                        .body(png);
            } catch (Exception e) {
                return ResponseEntity.status(500).body((byte[]) null);
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{orderId}/data")
    public ResponseEntity<?> getLabelData(@PathVariable UUID orderId) {
        return orderRepository.findById(orderId).map(order -> {
            try {
                String barcodeB64 = barcodeService.generateBarcodeBase64(order.getOrderNumber());
                String qrB64 = barcodeService.generateQrCodeBase64(order.getOrderNumber());
                return ResponseEntity.ok(Map.of(
                        "orderNumber", order.getOrderNumber(),
                        "barcode", barcodeB64,
                        "qrCode", qrB64,
                        "customerName", order.getCustomer().getName(),
                        "status", order.getStatus().name()
                ));
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }
}
