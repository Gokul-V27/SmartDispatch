package com.smartdispatch.repository;

import com.smartdispatch.entity.VerificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface VerificationLogRepository extends JpaRepository<VerificationLog, UUID> {
    List<VerificationLog> findByOrderId(UUID orderId);
    List<VerificationLog> findByWorkerId(UUID workerId);
}
