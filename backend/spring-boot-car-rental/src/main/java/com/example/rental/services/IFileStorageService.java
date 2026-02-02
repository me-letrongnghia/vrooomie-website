package com.example.rental.services;

import org.springframework.web.multipart.MultipartFile;

public interface IFileStorageService {
    String storeFile(MultipartFile file);
    void deleteFile(String fileName);
}
