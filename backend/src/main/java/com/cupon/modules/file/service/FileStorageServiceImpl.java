package com.cupon.modules.file.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.cupon.common.exception.FileUploadException;
import com.cupon.modules.file.dto.FileUploadResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageServiceImpl.class);

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> ALLOWED_SUBFOLDERS = Set.of("promotions", "logos");
    private static final long MAX_SIZE = 5L * 1024 * 1024; // 5 MB

    private final Cloudinary cloudinary;
    private final String baseFolder;

    public FileStorageServiceImpl(Cloudinary cloudinary,
            @Value("${app.cloudinary.folder}") String baseFolder) {
        this.cloudinary = cloudinary;
        this.baseFolder = baseFolder;
    }

    @Override
    public FileUploadResponse upload(MultipartFile file, String subfolder) {
        validate(file, subfolder);
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", baseFolder + "/" + subfolder, // ej: cupon/promotions
                    "resource_type", "image",
                    "transformation", "c_limit,w_1600,h_1600,q_auto,f_auto"));
            return new FileUploadResponse(
                    (String) result.get("secure_url"),
                    (String) result.get("public_id"),
                    (String) result.get("format"),
                    ((Number) result.get("bytes")).longValue(),
                    ((Number) result.get("width")).intValue(),
                    ((Number) result.get("height")).intValue());
        } catch (IOException e) {
            log.error("Error subiendo archivo a Cloudinary", e);
            throw new FileUploadException("No se pudo subir la imagen", e);
        }
    }

    @Override
    public void delete(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            log.warn("No se pudo borrar {} de Cloudinary", publicId, e);
        }
    }

    private void validate(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            throw new FileUploadException("El archivo está vacío");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new FileUploadException("Formato no permitido. Usa JPG, PNG o WEBP");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new FileUploadException("La imagen supera los 5 MB");
        }
        if (!ALLOWED_SUBFOLDERS.contains(subfolder)) {
            throw new FileUploadException("Carpeta no válida: " + subfolder);
        }
    }
}
