package com.cupon.modules.file.controller;

import com.cupon.common.dto.ApiResponse;
import com.cupon.modules.file.dto.FileUploadResponse;
import com.cupon.modules.file.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/files")
@Tag(name = "Archivos", description = "Subida de imagenes a CLoudinary")
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_RESTAURANTE')")
    @Operation(summary = "Sube una imagen (logo o promoción) y devuelve su URL")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "promotions") String folder) {

        FileUploadResponse response = fileStorageService.upload(file, folder);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Imagen subida correctamente", response));
    }

}
