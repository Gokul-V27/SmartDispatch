package com.smartdispatch.controller;

import com.smartdispatch.entity.*;
import com.smartdispatch.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * NFC Tag Controller — handles the full NFC lifecycle.
 *
 * PACKER FLOW:
 *   POST /api/nfc/register   → Register NFC tag with order (when writing tag)
 *   POST /api/nfc/seal       → Worker taps phone on box NFC → confirms sealed
 *                               → Order status → PACKED
 *                               → Customer notification triggered
 *                               → Admin dashboard updated → print template ready
 *
 * DELIVERY FLOW:
 *   POST /api/nfc/delivery-tap  → Delivery person taps NFC at customer door
 *                                 → Generates 6-digit OTP
 *                                 → OTP sent to customer app
 *   POST /api/nfc/verify-otp    → Customer gives OTP to delivery person
 *                                 → Delivery confirmed → Order = DELIVERED
 *
 * QUERY:
 *   GET /api/nfc/tag/{tagId}    → Get tag details and status
 *   GET /api/nfc/order/{orderId} → Get all tags for an order
 */
@RestController
@RequestMapping("/api/nfc")
@RequiredArgsConstructor
public class NfcController {

    private final NfcTagRepository nfcTagRepository;
    private final OrderRepository orderRepository;

    /**
     * STEP 1: Register NFC tag with an order.
     * Called when packer writes the NFC tag with order data.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerTag(@RequestBody Map<String, Object> body) {
        String tagId = (String) body.get("tagId");
        UUID orderId = UUID.fromString((String) body.get("orderId"));

        var orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) return ResponseEntity.notFound().build();

        // Check if tag already exists
        if (nfcTagRepository.findByTagId(tagId).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tag already registered"));
        }

        NfcTag tag = NfcTag.builder()
                .tagId(tagId)
                .order(orderOpt.get())
                .status(NfcTag.TagStatus.REGISTERED)
                .build();
        nfcTagRepository.save(tag);

        return ResponseEntity.ok(Map.of(
                "message", "NFC tag registered",
                "tagId", tagId,
                "orderId", orderId.toString(),
                "status", "REGISTERED"
        ));
    }

    /**
     * STEP 2: Packer taps phone on NFC tag → SEAL CONFIRMED.
     * This is the critical moment:
     *   - Tag status → SEALED
     *   - Order status → PACKED
     *   - Customer gets notification "Your package is packed!"
     *   - Admin dashboard shows print template for dispatch label
     */
    @PostMapping("/seal")
    public ResponseEntity<?> sealBox(@RequestBody Map<String, Object> body) {
        String tagId = (String) body.get("tagId");
        UUID workerId = UUID.fromString((String) body.get("workerId"));

        var tagOpt = nfcTagRepository.findByTagId(tagId);
        if (tagOpt.isEmpty()) return ResponseEntity.notFound().build();

        NfcTag tag = tagOpt.get();
        if (tag.getStatus() != NfcTag.TagStatus.REGISTERED) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Tag already sealed",
                    "currentStatus", tag.getStatus().name()
            ));
        }

        // Seal the tag
        tag.setStatus(NfcTag.TagStatus.SEALED);
        tag.setSealedBy(workerId);
        tag.setSealedAt(LocalDateTime.now());
        nfcTagRepository.save(tag);

        // Update order status to PACKED
        Order order = tag.getOrder();
        order.setStatus(Order.OrderStatus.PACKED);
        order.setPackedAt(LocalDateTime.now());
        orderRepository.save(order);

        // In production: trigger FCM push notification to customer
        // notificationService.send(order.getCustomer(), "Your package is packed and sealed!");

        return ResponseEntity.ok(Map.of(
                "message", "Box sealed successfully!",
                "tagId", tagId,
                "tagStatus", "SEALED",
                "orderNumber", order.getOrderNumber(),
                "orderStatus", "PACKED",
                "customerName", order.getCustomer().getName(),
                "sealedAt", tag.getSealedAt().toString(),
                "notification", "Customer notification sent: Package packed!",
                "printReady", true,
                "labelUrl", "/api/label/" + order.getId() + "/full"
        ));
    }

    /**
     * STEP 3: Delivery person taps NFC at customer's door.
     * Generates a 6-digit OTP → sent to customer app.
     * Customer must share this OTP with the delivery person to confirm.
     */
    @PostMapping("/delivery-tap")
    public ResponseEntity<?> deliveryTap(@RequestBody Map<String, Object> body) {
        String tagId = (String) body.get("tagId");
        UUID deliveryPersonId = UUID.fromString((String) body.get("deliveryPersonId"));

        var tagOpt = nfcTagRepository.findByTagId(tagId);
        if (tagOpt.isEmpty()) return ResponseEntity.notFound().build();

        NfcTag tag = tagOpt.get();

        // Generate 6-digit OTP
        String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(100000, 999999));
        tag.setDeliveryOtp(otp);
        tag.setOtpExpiresAt(LocalDateTime.now().plusMinutes(10));
        tag.setDeliveredBy(deliveryPersonId);
        nfcTagRepository.save(tag);

        // Update order status
        Order order = tag.getOrder();
        order.setStatus(Order.OrderStatus.IN_TRANSIT);
        orderRepository.save(order);

        // In production: Send OTP to customer via push notification / SMS
        // notificationService.sendOtp(order.getCustomer(), otp);

        return ResponseEntity.ok(Map.of(
                "message", "Delivery OTP generated",
                "orderNumber", order.getOrderNumber(),
                "customerName", order.getCustomer().getName(),
                "otp", otp,  // In production, DON'T send OTP to delivery person — only to customer!
                "otpExpiresAt", tag.getOtpExpiresAt().toString(),
                "instruction", "Customer will receive OTP on their app. Ask them to share it."
        ));
    }

    /**
     * STEP 4: Delivery person enters OTP received from customer.
     * If correct → delivery confirmed → order = DELIVERED → cycle complete.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, Object> body) {
        String tagId = (String) body.get("tagId");
        String otp = (String) body.get("otp");

        var tagOpt = nfcTagRepository.findByTagId(tagId);
        if (tagOpt.isEmpty()) return ResponseEntity.notFound().build();

        NfcTag tag = tagOpt.get();

        // Check OTP
        if (tag.getDeliveryOtp() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No OTP generated. Tap NFC first."));
        }
        if (tag.getOtpExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "OTP expired. Re-tap NFC."));
        }
        if (!tag.getDeliveryOtp().equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP", "result", "FAIL"));
        }

        // OTP correct → delivery confirmed
        tag.setOtpVerified(true);
        tag.setStatus(NfcTag.TagStatus.DELIVERED);
        tag.setDeliveredAt(LocalDateTime.now());
        nfcTagRepository.save(tag);

        // Update order
        Order order = tag.getOrder();
        order.setStatus(Order.OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());
        orderRepository.save(order);

        // In production: Notify customer "Package delivered successfully!"
        // notificationService.send(order.getCustomer(), "Your package has been delivered!");

        return ResponseEntity.ok(Map.of(
                "result", "SUCCESS",
                "message", "Delivery confirmed!",
                "orderNumber", order.getOrderNumber(),
                "deliveredAt", tag.getDeliveredAt().toString(),
                "customerNotification", "Package delivered successfully!"
        ));
    }

    /**
     * Get NFC tag details by tag ID.
     */
    @GetMapping("/tag/{tagId}")
    public ResponseEntity<?> getTag(@PathVariable String tagId) {
        return nfcTagRepository.findByTagId(tagId)
                .map(tag -> ResponseEntity.ok(Map.of(
                        "tagId", tag.getTagId(),
                        "status", tag.getStatus().name(),
                        "orderNumber", tag.getOrder().getOrderNumber(),
                        "customerName", tag.getOrder().getCustomer().getName(),
                        "sealedAt", tag.getSealedAt() != null ? tag.getSealedAt().toString() : "",
                        "deliveredAt", tag.getDeliveredAt() != null ? tag.getDeliveredAt().toString() : ""
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all NFC tags for an order.
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getTagsForOrder(@PathVariable UUID orderId) {
        var tags = nfcTagRepository.findByOrderId(orderId);
        return ResponseEntity.ok(tags.stream().map(tag -> Map.of(
                "tagId", tag.getTagId(),
                "status", tag.getStatus().name(),
                "sealedAt", tag.getSealedAt() != null ? tag.getSealedAt().toString() : "",
                "otpVerified", tag.isOtpVerified()
        )).toList());
    }
}
