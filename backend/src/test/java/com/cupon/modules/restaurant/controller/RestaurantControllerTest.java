package com.cupon.modules.restaurant.controller;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.config.SecurityConfig;
import com.cupon.modules.auth.service.JwtService;
import com.cupon.modules.restaurant.dto.RestaurantResponse;
import com.cupon.modules.restaurant.dto.UpdateRestaurantDto;
import com.cupon.modules.restaurant.service.RestaurantService;
import com.cupon.modules.user.entity.ApprovalStatus;
import com.cupon.modules.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RestaurantController.class)
@Import(SecurityConfig.class)
class RestaurantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RestaurantService restaurantService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    // ─── helpers ────────────────────────────────────────────────────────────

    private RestaurantResponse sampleRestaurant(UUID id) {
        return new RestaurantResponse(
                id, "Sushi House", "Sushi fresco", "Japonesa", "Carrera 15 # 90-45",
                null, "3009876543", ApprovalStatus.APPROVED,
                "resto@cupon.com", LocalDateTime.now());
    }

    // ─── GET /restaurants (público) ─────────────────────────────────────────

    @Test
    void getAll_esPublico_devuelve200() throws Exception {
        UUID id = UUID.randomUUID();
        when(restaurantService.getApprovedRestaurants(any(), any(), any()))
                .thenReturn(new PageResponse<>(List.of(sampleRestaurant(id)), 0, 20, 1, 1, true));

        mockMvc.perform(get("/api/v1/restaurants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(id.toString()))
                .andExpect(jsonPath("$.data.content[0].businessName").value("Sushi House"))
                .andExpect(jsonPath("$.data.content[0].cuisineType").value("Japonesa"));
    }

    @Test
    void getAll_conFiltros_devuelve200() throws Exception {
        UUID id = UUID.randomUUID();
        when(restaurantService.getApprovedRestaurants(eq("Sushi"), eq("Japonesa"), any()))
                .thenReturn(new PageResponse<>(List.of(sampleRestaurant(id)), 0, 20, 1, 1, true));

        mockMvc.perform(get("/api/v1/restaurants")
                        .param("search", "Sushi")
                        .param("cuisineType", "Japonesa"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(id.toString()))
                .andExpect(jsonPath("$.data.content[0].cuisineType").value("Japonesa"));
    }

    @Test
    void getAll_sinResultados_devuelveListaVacia() throws Exception {
        when(restaurantService.getApprovedRestaurants(any(), any(), any()))
                .thenReturn(new PageResponse<>(List.of(), 0, 20, 0, 0, true));

        mockMvc.perform(get("/api/v1/restaurants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isEmpty())
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    // ─── GET /restaurants/{id} (público) ────────────────────────────────────

    @Test
    void getById_existente_devuelve200() throws Exception {
        UUID id = UUID.randomUUID();
        when(restaurantService.getRestaurantById(id)).thenReturn(sampleRestaurant(id));

        mockMvc.perform(get("/api/v1/restaurants/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(id.toString()))
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));
    }

    @Test
    void getById_inexistente_devuelve404() throws Exception {
        UUID id = UUID.randomUUID();
        when(restaurantService.getRestaurantById(id))
                .thenThrow(new ResourceNotFoundException("Restaurante", "id", id));

        mockMvc.perform(get("/api/v1/restaurants/{id}", id))
                .andExpect(status().isNotFound());
    }

    // ─── GET /restaurants/me (ROLE_RESTAURANTE) ─────────────────────────────

    @Test
    void getMyRestaurant_sinAuth_devuelve401() throws Exception {
        mockMvc.perform(get("/api/v1/restaurants/me"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(authorities = "ROLE_CLIENTE")
    void getMyRestaurant_conRolCliente_devuelve403() throws Exception {
        mockMvc.perform(get("/api/v1/restaurants/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "resto@cupon.com", authorities = "ROLE_RESTAURANTE")
    void getMyRestaurant_conRolRestaurante_devuelve200() throws Exception {
        UUID id = UUID.randomUUID();
        when(restaurantService.getMyRestaurant("resto@cupon.com")).thenReturn(sampleRestaurant(id));

        mockMvc.perform(get("/api/v1/restaurants/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(id.toString()));
    }

    @Test
    @WithMockUser(username = "resto@cupon.com", authorities = "ROLE_RESTAURANTE")
    void getMyRestaurant_sinPerfilCreado_devuelve404() throws Exception {
        when(restaurantService.getMyRestaurant("resto@cupon.com"))
                .thenThrow(new ResourceNotFoundException("Perfil de restaurante", "userId", UUID.randomUUID()));

        mockMvc.perform(get("/api/v1/restaurants/me"))
                .andExpect(status().isNotFound());
    }

    // ─── PUT /restaurants/me (ROLE_RESTAURANTE) ─────────────────────────────

    @Test
    @WithMockUser(username = "resto@cupon.com", authorities = "ROLE_RESTAURANTE")
    void updateMyRestaurant_conDatosValidos_devuelve200() throws Exception {
        UUID id = UUID.randomUUID();
        UpdateRestaurantDto request = new UpdateRestaurantDto(
                "Sushi Premium", "Nuevo desc", "Japonesa", "Nueva calle", null, "3112345678");

        when(restaurantService.updateMyRestaurant(eq("resto@cupon.com"), any()))
                .thenReturn(sampleRestaurant(id));

        mockMvc.perform(put("/api/v1/restaurants/me")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Restaurante actualizado"));
    }

    @Test
    void updateMyRestaurant_sinAuth_devuelve401() throws Exception {
        UpdateRestaurantDto request = new UpdateRestaurantDto("Nuevo Nombre", null, null, null, null, null);

        mockMvc.perform(put("/api/v1/restaurants/me")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(authorities = "ROLE_CLIENTE")
    void updateMyRestaurant_conRolCliente_devuelve403() throws Exception {
        UpdateRestaurantDto request = new UpdateRestaurantDto("Nombre", null, null, null, null, null);

        mockMvc.perform(put("/api/v1/restaurants/me")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "otro@cupon.com", authorities = "ROLE_RESTAURANTE")
    void updateMyRestaurant_sinPerfilAsociado_devuelve404() throws Exception {
        UpdateRestaurantDto request = new UpdateRestaurantDto("Local Sin Perfil", null, null, null, null, null);
        when(restaurantService.updateMyRestaurant(eq("otro@cupon.com"), any()))
                .thenThrow(new ResourceNotFoundException("Perfil de restaurante", "userId", UUID.randomUUID()));

        mockMvc.perform(put("/api/v1/restaurants/me")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }
}
