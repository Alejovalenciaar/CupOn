package com.cupon.modules.file.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.cupon.common.exception.FileUploadException;
import com.cupon.modules.file.dto.FileUploadResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileStorageServiceImplTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    private FileStorageServiceImpl fileStorageService;

    private final String baseFolder = "cupon-test";

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageServiceImpl(cloudinary, baseFolder);
    }

    @Test
    @DisplayName("upload() - Sube imagen exitosamente cuando el archivo y carpeta son válidos")
    void upload_success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "hamburguesa.jpg",
                "image/jpeg",
                "contenido-de-prueba".getBytes());

        Map<String, Object> cloudinaryResponse = Map.of(
                "secure_url", "https://res.cloudinary.com/test/image/upload/cupon-test/promotions/sample.jpg",
                "public_id", "cupon-test/promotions/sample",
                "format", "jpg",
                "bytes", 1024L,
                "width", 800,
                "height", 600);

        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(cloudinaryResponse);

        FileUploadResponse response = fileStorageService.upload(file, "promotions");

        assertThat(response).isNotNull();
        assertThat(response.url())
                .isEqualTo("https://res.cloudinary.com/test/image/upload/cupon-test/promotions/sample.jpg");
        assertThat(response.publicId()).isEqualTo("cupon-test/promotions/sample");
        assertThat(response.format()).isEqualTo("jpg");
        assertThat(response.bytes()).isEqualTo(1024L);
        assertThat(response.width()).isEqualTo(800);
        assertThat(response.height()).isEqualTo(600);

        verify(uploader).upload(eq(file.getBytes()), anyMap());
    }

    @Test
    @DisplayName("upload() - Lanza FileUploadException si el archivo está vacío")
    void upload_emptyFile_throwsException() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> fileStorageService.upload(emptyFile, "logos"))
                .isInstanceOf(FileUploadException.class)
                .hasMessageContaining("El archivo está vacío");

        verifyNoInteractions(cloudinary);
    }

    @Test
    @DisplayName("upload() - Lanza FileUploadException si el tipo de archivo no es permitido")
    void upload_invalidContentType_throwsException() {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "document.pdf", "application/pdf", "pdf-bytes".getBytes());

        assertThatThrownBy(() -> fileStorageService.upload(pdfFile, "promotions"))
                .isInstanceOf(FileUploadException.class)
                .hasMessageContaining("Formato no permitido");

        verifyNoInteractions(cloudinary);
    }

    @Test
    @DisplayName("upload() - Lanza FileUploadException si el archivo supera los 5 MB")
    void upload_fileTooLarge_throwsException() {
        byte[] largeBytes = new byte[6 * 1024 * 1024]; // 6 MB
        MockMultipartFile largeFile = new MockMultipartFile(
                "file", "huge.jpg", "image/jpeg", largeBytes);

        assertThatThrownBy(() -> fileStorageService.upload(largeFile, "promotions"))
                .isInstanceOf(FileUploadException.class)
                .hasMessageContaining("supera los 5 MB");

        verifyNoInteractions(cloudinary);
    }

    @Test
    @DisplayName("upload() - Lanza FileUploadException si la carpeta no está permitida")
    void upload_invalidFolder_throwsException() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.webp", "image/webp", "bytes".getBytes());

        assertThatThrownBy(() -> fileStorageService.upload(file, "malicious_folder"))
                .isInstanceOf(FileUploadException.class)
                .hasMessageContaining("Carpeta no válida");

        verifyNoInteractions(cloudinary);
    }

    @Test
    @DisplayName("upload() - Lanza FileUploadException si Cloudinary falla con IOException")
    void upload_cloudinaryIOException_throwsException() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", "bytes".getBytes());

        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenThrow(new IOException("Cloudinary timeout"));

        assertThatThrownBy(() -> fileStorageService.upload(file, "logos"))
                .isInstanceOf(FileUploadException.class)
                .hasMessageContaining("No se pudo subir la imagen");
    }

    @Test
    @DisplayName("delete() - Llama al destroy de Cloudinary con el publicId")
    void delete_callsDestroy() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);

        fileStorageService.delete("cupon-test/promotions/sample");

        verify(uploader).destroy(eq("cupon-test/promotions/sample"), anyMap());
    }
}
