package com.smartdispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "products")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String sku; // SKU-DELL-3520-SLV

    @Column(nullable = false)
    private String name; // "Dell Inspiron 15"

    @Column(nullable = false)
    private String brand; // "Dell"

    private String modelNumber; // "IN3520-7890"

    @Column(nullable = false)
    private String category; // Electronics, Clothing, Grocery, etc.

    private String color; // "Silver" — critical for vision check

    private Double weightKg; // 2.5

    @Builder.Default
    private Integer weightToleranceG = 100; // ±grams tolerance

    private BigDecimal price;

    @Column(columnDefinition = "TEXT")
    private String specs; // JSON string: {"ram":"16GB","storage":"512GB"}

    @Column(columnDefinition = "TEXT")
    private String imageUrls; // Comma-separated image URLs

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private Integer stockQty = 0;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
