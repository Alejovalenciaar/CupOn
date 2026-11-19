package com.cupon.modules.file.controller;

import com.cupon.config.SecurityConfig;
import com.cupon.modules.auth.service.JwtService;
import com.cupon.modules.file.dto.FileUploadResponse;
import com.cupon.modules.file.service.FileStorageService;
import com.cupon.modules.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FileController.class)
@Import(SecurityConfig.class)
class FileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FileStorageService fileStorageService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @DisplayName("POST /api/v1/files/upload - Con rol ROLE_RESTAURANTE sube archivo y retorna 201")
    @WithMockUser(authorities = "ROLE_RESTAURANTE")
    void upload_asRestaurant_returns201() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "promo.jpg", "image/jpeg", "image-data".getBytes());

        FileUploadResponse response = new FileUploadResponse(
                "https://res.cloudinary.com/test/image.jpg",
                "cupon/promotions/promo123",
                "jpg",
                1024L,
                800,
                600);

        when(fileStorageService.upload(any(), eq("promotions"))).thenReturn(response);

        mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("folder", "promotions"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Imagen subida correctamente"))
                .andExpect(jsonPath("$.data.url").value("https://res.cloudinary.com/test/image.jpg"))
                .andExpect(jsonPath("$.data.publicId").value("cupon/promotions/promo123"));
    }

    @Test
    @DisplayName("POST /api/v1/files/upload - Con rol ROLE_CLIENTE retorna 403 Forbidden")
    @WithMockUser(authorities = "ROLE_CLIENTE")
    void upload_asClient_returns403() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "promo.jpg", "image/jpeg", "image-data".getBytes());

        mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/files/upload - Sin autenticación retorna 403 Forbidden")
    void upload_unauthenticated_returnsForbidden() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "promo.jpg", "image/jpeg", "image-data".getBytes());

        mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file))
                .andExpect(status().isForbidden());
    }
}
