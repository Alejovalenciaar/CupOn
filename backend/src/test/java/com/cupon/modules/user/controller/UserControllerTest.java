package com.cupon.modules.user.controller;

import com.cupon.config.SecurityConfig;
import com.cupon.modules.auth.service.JwtService;
import com.cupon.modules.user.dto.UpdateUserRequest;
import com.cupon.modules.user.dto.UserProfileResponse;
import com.cupon.modules.user.entity.Role;
import com.cupon.modules.user.repository.UserRepository;
import com.cupon.modules.user.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @WithMockUser(username = "cliente@test.com", authorities = "ROLE_CLIENTE")
    void getMyProfile_usuarioAutenticado_devuelve200() throws Exception {
        UserProfileResponse response = new UserProfileResponse(
                UUID.randomUUID(),
                "cliente@test.com",
                "Alejo",
                "Valencia",
                "+57 300 1234567",
                Role.ROLE_CLIENTE,
                true,
                LocalDateTime.now());

        when(userService.getMyProfile("cliente@test.com")).thenReturn(response);

        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("cliente@test.com"))
                .andExpect(jsonPath("$.data.phoneNumber").value("+57 300 1234567"));
    }

    @Test
    void getMyProfile_whenUnauthenticated_shouldReturnForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "cliente@test.com", authorities = "ROLE_CLIENTE")
    void updateMyProfile_comoClienteConDatosValidos_devuelve200() throws Exception {
        UpdateUserRequest request = new UpdateUserRequest("Carlos", "Gomez", "+57 311 9876543");
        UserProfileResponse response = new UserProfileResponse(
                UUID.randomUUID(),
                "cliente@test.com",
                "Carlos",
                "Gomez",
                "+57 311 9876543",
                Role.ROLE_CLIENTE,
                true,
                LocalDateTime.now());

        when(userService.updateMyProfile(eq("cliente@test.com"), any(UpdateUserRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.firstName").value("Carlos"))
                .andExpect(jsonPath("$.data.phoneNumber").value("+57 311 9876543"));
    }

    @Test
    @WithMockUser(username = "restaurante@test.com", authorities = "ROLE_RESTAURANTE")
    void updateMyProfile_comoRestaurante_devuelve403() throws Exception {
        UpdateUserRequest request = new UpdateUserRequest("Carlos", "Gomez", "+57 311 9876543");

        mockMvc.perform(put("/api/v1/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "cliente@test.com", authorities = "ROLE_CLIENTE")
    void updateMyProfile_telefonoInvalido_devuelve400() throws Exception {
        // Formato con letras no permitido por la expresión regular
        UpdateUserRequest invalidRequest = new UpdateUserRequest("Carlos", "Gomez", "telefono-invalido");

        mockMvc.perform(put("/api/v1/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }
}
