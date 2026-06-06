package com.smartdispatch.repository;

import com.smartdispatch.entity.NfcTag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface NfcTagRepository extends JpaRepository<NfcTag, UUID> {
    Optional<NfcTag> findByTagId(String tagId);
    List<NfcTag> findByOrderId(UUID orderId);
    List<NfcTag> findByStatus(NfcTag.TagStatus status);
}
