package com.smartdispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String orderNumber; // ORD-2024-8821

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "packer_id")
    private User packer;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    private BigDecimal totalAmount;

    @Column(columnDefinition = "TEXT")
    private String shippingAddress; // JSON: {name, street, city, state, pin, phone}

    private String trackingNumber;
    private String labelUrl;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> items;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime packedAt;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;

    public enum OrderStatus {
        PENDING, ASSIGNED, PACKING, VERIFIED, PACKED, SHIPPED, IN_TRANSIT, DELIVERED, CANCELLED
    }
}
