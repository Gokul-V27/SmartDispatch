package com.smartdispatch.controller;

import com.smartdispatch.entity.*;
import com.smartdispatch.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final com.smartdispatch.service.NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String status,
                                    @RequestParam(required = false) String role,
                                    @RequestParam(required = false) UUID userId) {
        List<Order> orders;
        if (status != null) {
            orders = orderRepository.findByStatus(Order.OrderStatus.valueOf(status));
        } else if (userId != null && "CUSTOMER".equals(role)) {
            orders = orderRepository.findByCustomerId(userId);
        } else if (userId != null && "PACKER".equals(role)) {
            orders = orderRepository.findByPackerId(userId);
        } else {
            orders = orderRepository.findAll();
        }

        var result = orders.stream().map(this::toOrderMap).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable UUID id) {
        return orderRepository.findById(id)
                .map(order -> ResponseEntity.ok(toOrderMap(order)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/public")
    public ResponseEntity<?> getPublicById(@PathVariable UUID id) {
        return orderRepository.findById(id)
                .map(order -> {
                    var items = orderItemRepository.findByOrderId(order.getId()).stream().map(item -> Map.of(
                            "name", item.getProduct().getName(),
                            "quantity", item.getQuantity()
                    )).collect(Collectors.toList());
                    
                    return ResponseEntity.ok(Map.of(
                            "orderId", order.getId(),
                            "orderNumber", order.getOrderNumber(),
                            "status", order.getStatus().name(),
                            "items", items,
                            "estimatedDelivery", order.getCreatedAt().plusDays(3).toString()
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        UUID customerId = UUID.fromString((String) body.get("customerId"));
        var customer = userRepository.findById(customerId);
        if (customer.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Customer not found"));
        }

        String orderNumber = "ORD-" + Year.now().getValue() + "-" + String.format("%04d", (int)(Math.random() * 9999));

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customer(customer.get())
                .shippingAddress((String) body.getOrDefault("shippingAddress", "{}"))
                .build();

        // Calculate total from items
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itemsList = (List<Map<String, Object>>) body.get("items");
        BigDecimal total = BigDecimal.ZERO;

        order = orderRepository.save(order);

        if (itemsList != null) {
            for (Map<String, Object> item : itemsList) {
                UUID productId = UUID.fromString((String) item.get("productId"));
                int qty = ((Number) item.get("quantity")).intValue();
                var product = productRepository.findById(productId);
                if (product.isPresent()) {
                    OrderItem orderItem = OrderItem.builder()
                            .order(order)
                            .product(product.get())
                            .quantity(qty)
                            .build();
                    orderItemRepository.save(orderItem);
                    if (product.get().getPrice() != null) {
                        total = total.add(product.get().getPrice().multiply(BigDecimal.valueOf(qty)));
                    }
                }
            }
        }

        order.setTotalAmount(total);
        orderRepository.save(order);

        return ResponseEntity.ok(toOrderMap(order));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignPacker(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        UUID packerId = UUID.fromString(body.get("packerId"));
        return orderRepository.findById(id).map(order -> {
            var packer = userRepository.findById(packerId);
            if (packer.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Packer not found"));
            order.setPacker(packer.get());
            order.setStatus(Order.OrderStatus.ASSIGNED);
            orderRepository.save(order);
            return ResponseEntity.ok(toOrderMap(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        String newStatusStr = body.get("status");
        Order.OrderStatus newStatus;
        try {
            newStatus = Order.OrderStatus.valueOf(newStatusStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + newStatusStr));
        }

        return orderRepository.findById(id).map(order -> {
            // Optional: validate transition (e.g. PACKED -> LABEL_PRINTED -> SHIPPED)
            // if (newStatus.ordinal() < order.getStatus().ordinal()) return error; // strictly forward
            
            order.setStatus(newStatus);
            if (newStatus == Order.OrderStatus.PACKED) order.setPackedAt(LocalDateTime.now());
            if (newStatus == Order.OrderStatus.SHIPPED) order.setShippedAt(LocalDateTime.now());
            if (newStatus == Order.OrderStatus.DELIVERED) order.setDeliveredAt(LocalDateTime.now());
            
            orderRepository.save(order);
            
            // Notify client & log event
            notificationService.notifyClient(order, newStatus);
            
            return ResponseEntity.ok(toOrderMap(order));
        }).orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toOrderMap(Order order) {
        var items = orderItemRepository.findByOrderId(order.getId()).stream().map(item -> Map.of(
                "id", item.getId(),
                "productId", item.getProduct().getId(),
                "productName", item.getProduct().getName(),
                "productBrand", item.getProduct().getBrand(),
                "productSku", item.getProduct().getSku(),
                "productColor", item.getProduct().getColor() != null ? item.getProduct().getColor() : "",
                "quantity", item.getQuantity(),
                "ocrVerified", item.isOcrVerified(),
                "visionVerified", item.isVisionVerified(),
                "weightVerified", item.isWeightVerified()
        )).collect(Collectors.toList());

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", order.getId());
        map.put("orderNumber", order.getOrderNumber());
        map.put("customerId", order.getCustomer().getId());
        map.put("customerName", order.getCustomer().getName());
        map.put("status", order.getStatus());
        map.put("totalAmount", order.getTotalAmount());
        map.put("shippingAddress", order.getShippingAddress());
        map.put("packerId", order.getPacker() != null ? order.getPacker().getId() : null);
        map.put("packerName", order.getPacker() != null ? order.getPacker().getName() : null);
        map.put("items", items);
        map.put("createdAt", order.getCreatedAt());
        map.put("packedAt", order.getPackedAt());
        return map;
    }
}
