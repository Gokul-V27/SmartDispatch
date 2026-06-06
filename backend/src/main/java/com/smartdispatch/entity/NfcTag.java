package com.smartdispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * NFC Tag entity — each box gets an NFC tag.
 *
 * Lifecycle:
 * 1. REGISTERED — Tag is written with order data (packer writes tag)
 * 2. SEALED     — Packer taps phone on tag → confirms box is sealed → customer notified
 * 3. LOADED     — Gate scan confirms tag is on truck
 * 4. DELIVERED  — Delivery person taps NFC → generates OTP → customer verifies
 */
@Entity
@Table(name = "nfc_tags")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NfcTag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String tagId;           // NFC tag serial: e.g. "NFC-04219-001"

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TagStatus status = TagStatus.REGISTERED;

    private UUID sealedBy;          // Worker who sealed it
    private LocalDateTime sealedAt;

    private UUID deliveredBy;       // Delivery person
    private LocalDateTime deliveredAt;

    private String deliveryOtp;     // 6-digit OTP for delivery confirmation
    private LocalDateTime otpExpiresAt;
    private boolean otpVerified;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum TagStatus {
        REGISTERED, SEALED, LOADED, IN_TRANSIT, DELIVERED, RETURNED
    }
}
