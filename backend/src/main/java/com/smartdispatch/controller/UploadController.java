package com.smartdispatch.controller;

import com.smartdispatch.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

/**
 * File upload controller — stores files in either local filesystem (dev) or Cloudflare R2 (prod).
 * 
 * Upload paths by type:
 *   products/{productId}/{filename}   — Admin product photos for AI vision matching
 *   seals/{orderId}/{filename}        — Tamper seal evidence photos
 *   vision/{orderId}/{filename}       — AI vision capture frames
 *   labels/{orderId}/{filename}       — Generated dispatch label PDFs
 */
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final StorageService storageService;

    @PostMapping("/product/{productId}")
    public ResponseEntity<?> uploadProductPhoto(@PathVariable String productId,
                                                 @RequestParam("file") MultipartFile file) {
        String filename = UUID.randomUUID() + getExtension(file.getOriginalFilename());
        String url = storageService.upload("products/" + productId, filename, file);
        return ResponseEntity.ok(Map.of("url", url, "key", "products/" + productId + "/" + filename));
    }

    @PostMapping("/seal/{orderId}")
    public ResponseEntity<?> uploadSealPhoto(@PathVariable String orderId,
                                              @RequestParam("file") MultipartFile file) {
        String filename = UUID.randomUUID() + getExtension(file.getOriginalFilename());
        String url = storageService.upload("seals/" + orderId, filename, file);
        return ResponseEntity.ok(Map.of("url", url, "key", "seals/" + orderId + "/" + filename));
    }

    @PostMapping("/vision/{orderId}")
    public ResponseEntity<?> uploadVisionCapture(@PathVariable String orderId,
                                                  @RequestParam("file") MultipartFile file) {
        String filename = UUID.randomUUID() + getExtension(file.getOriginalFilename());
        String url = storageService.upload("vision/" + orderId, filename, file);
        return ResponseEntity.ok(Map.of("url", url, "key", "vision/" + orderId + "/" + filename));
    }

    @DeleteMapping
    public ResponseEntity<?> deleteFile(@RequestParam String key) {
        storageService.delete(key);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    private String getExtension(String filename) {
        if (filename == null) return ".bin";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".bin";
    }
}
