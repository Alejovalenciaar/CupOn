package com.cupon.modules.auth.controller;

import com.cupon.config.SecurityConfig;
import com.cupon.modules.auth.dto.AuthResponse;
import com.cupon.modules.auth.dto.LoginRequest;
import com.cupon.modules.auth.dto.RegisterClientRequest;
import com.cupon.modules.auth.service.AuthService;
import com.cupon.modules.auth.service.JwtService;
import com.cupon.modules.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void registerClient_conDatosValidos_devuelve201() throws Exception {
        RegisterClientRequest request = new RegisterClientRequest(
                "nuevo@cupon.com", "password123", "Ana", "Perez");
        when(authService.registerClient(any())).thenReturn(
                new AuthResponse("token-123", request.email(), "ROLE_CLIENTE"));

        mockMvc.perform(post("/api/v1/auth/register/client")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("token-123"));
    }

    @Test
    void registerClient_conCorreoInvalido_devuelve400() throws Exception {
        RegisterClientRequest request = new RegisterClientRequest(
                "no-es-un-correo", "password123", "Ana", "Perez");

        mockMvc.perform(post("/api/v1/auth/register/client")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_conCredencialesValidas_devuelve200() throws Exception {
        LoginRequest request = new LoginRequest("user@cupon.com", "password123");
        when(authService.login(any())).thenReturn(
                new AuthResponse("token-789", request.email(), "ROLE_CLIENTE"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").value("token-789"));
    }

    @Test
    void login_conCredencialesInvalidas_devuelve401() throws Exception {
        LoginRequest request = new LoginRequest("user@cupon.com", "wrongpassword");
        when(authService.login(any())).thenThrow(new BadCredentialsException("Credenciales inválidas"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }
}
