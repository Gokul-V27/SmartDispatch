package com.smartdispatch.controller;

import com.smartdispatch.entity.Order;
import com.smartdispatch.repository.OrderItemRepository;
import com.smartdispatch.repository.OrderRepository;
import com.smartdispatch.repository.VerificationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Public tracking endpoint — no auth required.
 * Customer uses order number from QR code to track.
 */
@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final VerificationLogRepository verificationLogRepository;

    @GetMapping("/{orderNumber}")
    public ResponseEntity<?> track(@PathVariable String orderNumber) {
        var orderOpt = orderRepository.findByOrderNumber(orderNumber);
        if (orderOpt.isEmpty()) return ResponseEntity.notFound().build();

        Order order = orderOpt.get();

        // Build timeline
        List<Map<String, Object>> timeline = new ArrayList<>();
        timeline.add(Map.of("step", "Order Placed", "status", "done",
                "time", order.getCreatedAt().toString()));

        if (order.getStatus().ordinal() >= Order.OrderStatus.ASSIGNED.ordinal()) {
            timeline.add(Map.of("step", "Packer Assigned", "status", "done",
                    "detail", order.getPacker() != null ? "Assigned to " + order.getPacker().getName() : ""));
        }

        if (order.getStatus().ordinal() >= Order.OrderStatus.PACKING.ordinal()) {
            timeline.add(Map.of("step", "Verification In Progress", "status", "done",
                    "detail", "OCR + Vision + Weight checks"));
        }

        if (order.getStatus().ordinal() >= Order.OrderStatus.PACKED.ordinal()) {
            timeline.add(Map.of("step", "Packed & Verified", "status", "done",
                    "time", order.getPackedAt() != null ? order.getPackedAt().toString() : "",
                    "detail", "All items verified ✓"));
        } else if (order.getStatus() == Order.OrderStatus.PACKING || 
                   order.getStatus() == Order.OrderStatus.VERIFIED) {
            timeline.add(Map.of("step", "Packing", "status", "current"));
        } else {
            timeline.add(Map.of("step", "Packing", "status", "pending"));
        }

        if (order.getStatus().ordinal() >= Order.OrderStatus.LABEL_PRINTED.ordinal()) {
            timeline.add(Map.of("step", "Label Printed", "status", "done",
                    "detail", "Ready for dispatch"));
        } else if (order.getStatus() == Order.OrderStatus.PACKED) {
            timeline.add(Map.of("step", "Label Printed", "status", "current"));
        } else {
            timeline.add(Map.of("step", "Label Printed", "status", "pending"));
        }

        if (order.getStatus().ordinal() >= Order.OrderStatus.SHIPPED.ordinal()) {
            timeline.add(Map.of("step", "Shipped", "status", "done",
                    "time", order.getShippedAt() != null ? order.getShippedAt().toString() : ""));
        } else if (order.getStatus() == Order.OrderStatus.LABEL_PRINTED) {
            timeline.add(Map.of("step", "Shipped", "status", "current"));
        } else {
            timeline.add(Map.of("step", "Shipped", "status", "pending"));
        }

        if (order.getStatus() == Order.OrderStatus.DELIVERED) {
            timeline.add(Map.of("step", "Delivered", "status", "done",
                    "time", order.getDeliveredAt() != null ? order.getDeliveredAt().toString() : ""));
        } else if (order.getStatus() == Order.OrderStatus.IN_TRANSIT || order.getStatus() == Order.OrderStatus.SHIPPED) {
            timeline.add(Map.of("step", "Delivered", "status", "current"));
        } else {
            timeline.add(Map.of("step", "Delivered", "status", "pending"));
        }

        var items = orderItemRepository.findByOrderId(order.getId()).stream().map(i -> Map.of(
                "name", i.getProduct().getName(),
                "brand", i.getProduct().getBrand(),
                "quantity", i.getQuantity(),
                "verified", i.isOcrVerified() && i.isVisionVerified() && i.isWeightVerified()
        )).collect(Collectors.toList());

        // Note: VerificationLogRepository was unused but injected. 
        // I'll leave it as is or we can inject OrderEventRepository instead if we want to show events here.
        // Actually, let's just return what we have since we updated the timeline correctly.

        return ResponseEntity.ok(Map.of(
                "orderNumber", order.getOrderNumber(),
                "status", order.getStatus().name(),
                "customerName", order.getCustomer().getName(),
                "timeline", timeline,
                "items", items
        ));
    }
}
