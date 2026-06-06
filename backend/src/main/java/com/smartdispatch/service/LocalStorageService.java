package com.smartdispatch.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;

@Service
@ConditionalOnProperty(name = "storage.mode", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private static final String UPLOAD_DIR = "uploads";

    @Override
    public String upload(String folder, String filename, MultipartFile file) {
        try {
            Path dir = Paths.get(UPLOAD_DIR, folder);
            Files.createDirectories(dir);
            Path path = dir.resolve(filename);
            Files.write(path, file.getBytes());
            return "/uploads/" + folder + "/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("File upload failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String key) {
        try {
            Files.deleteIfExists(Paths.get(UPLOAD_DIR, key));
        } catch (IOException e) {
            // ignore
        }
    }

    @Override
    public String getUrl(String key) {
        return "/uploads/" + key;
    }
}
