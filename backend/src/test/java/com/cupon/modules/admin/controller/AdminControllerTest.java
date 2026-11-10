package com.cupon.modules.admin.controller;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.config.SecurityConfig;
import com.cupon.modules.admin.dto.ApproveRestaurantRequest;
import com.cupon.modules.admin.dto.SystemMetricsResponse;
import com.cupon.modules.admin.service.AdminService;
import com.cupon.modules.auth.service.JwtService;
import com.cupon.modules.restaurant.dto.RestaurantResponse;
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
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@Import(SecurityConfig.class)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AdminService adminService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    // ─── helpers ────────────────────────────────────────────────────────────

    private RestaurantResponse sampleRestaurant(UUID id) {
        return new RestaurantResponse(
                id, "Pizza Feliz", "desc", "Pizzería", "Calle 1",
                null, null,
                null, "3001234567", ApprovalStatus.PENDING,
                UUID.randomUUID(), true,
                "owner@cupon.com", LocalDateTime.now());
    }

    // ─── getPendingRestaurants ──────────────────────────────────────────────

    @Test
    void getPendingRestaurants_sinAuth_devuelve401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/restaurants/pending"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(authorities = "ROLE_CLIENTE")
    void getPendingRestaurants_conRolCliente_devuelve403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/restaurants/pending"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getPendingRestaurants_conRolAdmin_devuelve200() throws Exception {
        UUID id = UUID.randomUUID();
        when(adminService.getPendingRestaurants(any()))
                .thenReturn(new PageResponse<>(List.of(sampleRestaurant(id)), 0, 20, 1, 1, true));

        mockMvc.perform(get("/api/v1/admin/restaurants/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(id.toString()))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getPendingRestaurants_sinResultados_devuelveListaVacia() throws Exception {
        when(adminService.getPendingRestaurants(any()))
                .thenReturn(new PageResponse<>(List.of(), 0, 20, 0, 0, true));

        mockMvc.perform(get("/api/v1/admin/restaurants/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isEmpty());
    }

    // ─── approveRestaurant ──────────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void approveRestaurant_conDatosValidos_devuelve200() throws Exception {
        UUID id = UUID.randomUUID();
        ApproveRestaurantRequest request = new ApproveRestaurantRequest(true, null);

        doNothing().when(adminService).approveOrRejectRestaurant(eq(id), any());

        mockMvc.perform(put("/api/v1/admin/restaurants/{id}/approve", id)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Restaurante aprobado"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void rejectRestaurant_conRazon_devuelve200() throws Exception {
        UUID id = UUID.randomUUID();
        ApproveRestaurantRequest request = new ApproveRestaurantRequest(false, "Documentos insuficientes");

        doNothing().when(adminService).approveOrRejectRestaurant(eq(id), any());

        mockMvc.perform(put("/api/v1/admin/restaurants/{id}/approve", id)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Restaurante rechazado"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void approveRestaurant_restauranteInexistente_devuelve404() throws Exception {
        UUID id = UUID.randomUUID();
        ApproveRestaurantRequest request = new ApproveRestaurantRequest(true, null);

        doThrow(new ResourceNotFoundException("Restaurante", "id", id))
                .when(adminService).approveOrRejectRestaurant(eq(id), any());

        mockMvc.perform(put("/api/v1/admin/restaurants/{id}/approve", id)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(authorities = "ROLE_RESTAURANTE")
    void approveRestaurant_conRolRestaurante_devuelve403() throws Exception {
        UUID id = UUID.randomUUID();
        ApproveRestaurantRequest request = new ApproveRestaurantRequest(true, null);

        mockMvc.perform(put("/api/v1/admin/restaurants/{id}/approve", id)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // ─── suspendUser ────────────────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void suspendUser_usuarioExistente_devuelve200() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(adminService).suspendUser(id);

        mockMvc.perform(put("/api/v1/admin/users/{id}/suspend", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void suspendUser_usuarioInexistente_devuelve404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ResourceNotFoundException("Usuario", "id", id))
                .when(adminService).suspendUser(id);

        mockMvc.perform(put("/api/v1/admin/users/{id}/suspend", id))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(authorities = "ROLE_CLIENTE")
    void suspendUser_conRolCliente_devuelve403() throws Exception {
        mockMvc.perform(put("/api/v1/admin/users/{id}/suspend", UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    // ─── deletePromotion ────────────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void deletePromotion_existente_devuelve200() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(adminService).deletePromotion(id);

        mockMvc.perform(delete("/api/v1/admin/promotions/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Promoción eliminada por moderación"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void deletePromotion_inexistente_devuelve404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ResourceNotFoundException("Promoción", "id", id))
                .when(adminService).deletePromotion(id);

        mockMvc.perform(delete("/api/v1/admin/promotions/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void deletePromotion_sinAuth_devuelve401() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/promotions/{id}", UUID.randomUUID()))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getAllPromotions_conRolAdmin_devuelve200() throws Exception {
        when(adminService.getAllPromotions(any()))
                .thenReturn(new PageResponse<>(List.of(), 0, 20, 0, 0, true));

        mockMvc.perform(get("/api/v1/admin/promotions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ─── getMetrics ─────────────────────────────────────────────────────────

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getMetrics_conRolAdmin_devuelve200ConDatos() throws Exception {
        when(adminService.getSystemMetrics())
                .thenReturn(new SystemMetricsResponse(50L, 10L, 3L, 25L, 18L));

        mockMvc.perform(get("/api/v1/admin/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalUsers").value(50))
                .andExpect(jsonPath("$.data.totalRestaurants").value(10))
                .andExpect(jsonPath("$.data.pendingApprovals").value(3))
                .andExpect(jsonPath("$.data.totalPromotions").value(25))
                .andExpect(jsonPath("$.data.activePromotions").value(18));
    }

    @Test
    @WithMockUser(authorities = "ROLE_RESTAURANTE")
    void getMetrics_conRolRestaurante_devuelve403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/metrics"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getMetrics_sinAuth_devuelve401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/metrics"))
                .andExpect(status().is4xxClientError());
    }
}
