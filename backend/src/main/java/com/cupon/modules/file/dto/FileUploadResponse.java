package com.cupon.modules.file.dto;

public record FileUploadResponse(
        String url,       // URL https pública, la que se guarda en imageUrl / logoUrl
        String publicId,  // id en Cloudinary, sirve para borrar la imagen después
        String format,
        long bytes,       // tamaño final del archivo
        int width,
        int height) {
}
