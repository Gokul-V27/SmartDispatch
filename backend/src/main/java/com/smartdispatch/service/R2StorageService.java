package com.smartdispatch.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import jakarta.annotation.PostConstruct;
import java.net.URI;

/**
 * Cloudflare R2 Storage Service (S3-compatible).
 *
 * R2 is used for fast-access binary assets:
 * - Product photos (admin uploads for AI vision matching)
 * - Seal evidence photos (tamper-proof packing proof)
 * - AI vision captures (camera frames from packer app)
 * - Dispatch label PDFs
 *
 * Why R2 over S3:
 * - Zero egress fees (crucial for serving product images to mobile app)
 * - S3-compatible API (drop-in replacement)
 * - Cloudflare's edge network for fast global delivery
 */
@Service
@ConditionalOnProperty(name = "storage.mode", havingValue = "r2")
public class R2StorageService implements StorageService {

    @Value("${r2.account-id}")
    private String accountId;

    @Value("${r2.access-key}")
    private String accessKey;

    @Value("${r2.secret-key}")
    private String secretKey;

    @Value("${r2.bucket}")
    private String bucket;

    @Value("${r2.public-url}")
    private String publicUrl;

    private S3Client s3;

    @PostConstruct
    public void init() {
        String endpoint = String.format("https://%s.r2.cloudflarestorage.com", accountId);
        s3 = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.of("auto"))
                .forcePathStyle(true)
                .build();
    }

    @Override
    public String upload(String folder, String filename, MultipartFile file) {
        String key = folder + "/" + filename;
        try {
            s3.putObject(
                PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build(),
                RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
            return getUrl(key);
        } catch (Exception e) {
            throw new RuntimeException("R2 upload failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String key) {
        try {
            s3.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket).key(key).build());
        } catch (Exception e) {
            // log silently
        }
    }

    @Override
    public String getUrl(String key) {
        if (publicUrl != null && !publicUrl.isEmpty()) {
            return publicUrl + "/" + key;
        }
        return String.format("https://%s.r2.cloudflarestorage.com/%s/%s", accountId, bucket, key);
    }
}
