package com.smartdispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "verification_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class VerificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID orderId;

    private UUID orderItemId;

    @Column(nullable = false)
    private UUID workerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStep step;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationResult result;

    @Column(columnDefinition = "TEXT")
    private String scannedData; // JSON: what OCR/Vision detected

    @Column(columnDefinition = "TEXT")
    private String expectedData; // JSON: what was expected

    @Column(columnDefinition = "TEXT")
    private String mismatchFields; // e.g. "color,model_number"

    private String photoUrl;
    private Double confidence;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum VerificationStep {
        OCR, VISION, WEIGHT
    }

    public enum VerificationResult {
        PASS, FAIL, WARN
    }
}
