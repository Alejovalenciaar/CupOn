package com.cupon.modules.file.service;

import org.springframework.web.multipart.MultipartFile;
import com.cupon.modules.file.dto.FileUploadResponse;

public interface FileStorageService {
    FileUploadResponse upload(MultipartFile file, String subfolder);

    void delete(String publicId);

}
