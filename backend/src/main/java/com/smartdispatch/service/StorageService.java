package com.smartdispatch.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    /** Upload file and return its public URL */
    String upload(String folder, String filename, MultipartFile file);
    /** Delete a file by key */
    void delete(String key);
    /** Get public URL for a key */
    String getUrl(String key);
}
