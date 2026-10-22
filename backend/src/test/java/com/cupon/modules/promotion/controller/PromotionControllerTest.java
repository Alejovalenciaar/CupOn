package com.cupon.modules.promotion.controller;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.config.SecurityConfig;
import com.cupon.modules.auth.service.JwtService;
import com.cupon.modules.promotion.dto.CreatePromotionRequest;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.dto.UpdatePromotionStatusRequest;
import com.cupon.modules.promotion.entity.DiscountType;
import com.cupon.modules.promotion.entity.PromotionStatus;
import com.cupon.modules.promotion.service.PromotionService;
import com.cupon.modules.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;

@WebMvcTest(PromotionController.class)
@Import(SecurityConfig.class)
class PromotionControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @MockitoBean
        private PromotionService promotionService;

        @MockitoBean
        private JwtService jwtService;

        @MockitoBean
        private UserRepository userRepository;

        private PromotionResponse samplePromotion(UUID id) {
                return new PromotionResponse(
                                id, "2x1 en pizzas", "descripcion", "CODE1", DiscountType.PERCENTAGE,
                                BigDecimal.TEN, BigDecimal.ZERO, LocalDateTime.now(), LocalDateTime.now().plusDays(5),
                                100, 0, PromotionStatus.ACTIVE, null, "Pizza Feliz", UUID.randomUUID(),
                                Set.of(), LocalDateTime.now(), Set.of(), true);
        }

        private CreatePromotionRequest sampleRequest() {
                return new CreatePromotionRequest(
                                "2x1 en pizzas", "descripcion", "CODE1", DiscountType.PERCENTAGE,
                                BigDecimal.TEN, BigDecimal.ZERO, LocalDateTime.now(),
                                LocalDateTime.now().plusDays(5), 100, null, Set.of(), Set.of());
        }

        @Test
        void getAll_esPublico_devuelve200() throws Exception {
                UUID id = UUID.randomUUID();
                when(promotionService.getActivePromotions(eq(null), eq(null), any()))
                                .thenReturn(new PageResponse<>(List.of(samplePromotion(id)), 0, 20, 1, 1, true));

                mockMvc.perform(get("/api/v1/promotions"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.content[0].id").value(id.toString()));
        }

        @Test
        void getAll_conFiltroDeDia_pasaElParametroAlService() throws Exception {
                UUID id = UUID.randomUUID();
                when(promotionService.getActivePromotions(eq(null), eq(DayOfWeek.MONDAY), any()))
                                .thenReturn(new PageResponse<>(List.of(samplePromotion(id)), 0, 20, 1, 1, true));

                mockMvc.perform(get("/api/v1/promotions").param("dayOfWeek", "MONDAY"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.content[0].id").value(id.toString()));
        }

        @Test
        void getAll_conDiaSinResultados_devuelveListaVacia() throws Exception {
                when(promotionService.getActivePromotions(eq(null), eq(DayOfWeek.SUNDAY), any()))
                                .thenReturn(new PageResponse<>(List.of(), 0, 20, 0, 0, true));

                mockMvc.perform(get("/api/v1/promotions").param("dayOfWeek", "SUNDAY"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.content").isEmpty());
        }

        @Test
        void getById_promocionInexistente_devuelve404() throws Exception {
                UUID id = UUID.randomUUID();
                when(promotionService.getPromotionById(id))
                                .thenThrow(new ResourceNotFoundException("Promoción", "id", id));

                mockMvc.perform(get("/api/v1/promotions/{id}", id))
                                .andExpect(status().isNotFound());
        }

        @Test
        void create_sinAutenticacion_esRechazada() throws Exception {
                mockMvc.perform(post("/api/v1/promotions")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(sampleRequest())))
                                .andExpect(status().is4xxClientError());
        }

        @Test
        @WithMockUser(authorities = "ROLE_CLIENTE")
        void create_conRolIncorrecto_devuelve403() throws Exception {
                mockMvc.perform(post("/api/v1/promotions")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(sampleRequest())))
                                .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(username = "resto@cupon.com", authorities = "ROLE_RESTAURANTE")
        void create_conRolRestaurante_devuelve201() throws Exception {
                UUID id = UUID.randomUUID();
                when(promotionService.createPromotion(eq("resto@cupon.com"), any()))
                                .thenReturn(samplePromotion(id));

                mockMvc.perform(post("/api/v1/promotions")
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(sampleRequest())))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.data.id").value(id.toString()));
        }

        @Test
        @WithMockUser(username = "otro@cupon.com", authorities = "ROLE_RESTAURANTE")
        void delete_deOtroRestaurante_devuelve403() throws Exception {
                UUID id = UUID.randomUUID();
                org.mockito.Mockito
                                .doThrow(new AccessDeniedException("No tienes permisos para eliminar esta promoción"))
                                .when(promotionService).deletePromotion(eq("otro@cupon.com"), eq(id));

                mockMvc.perform(delete("/api/v1/promotions/{id}", id))
                                .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(username = "resto@cupon.com", authorities = "ROLE_RESTAURANTE")
        void updateStatus_whenRestaurant_shouldReturn200() throws Exception {
                UUID id = UUID.randomUUID();
                UpdatePromotionStatusRequest request = new UpdatePromotionStatusRequest(PromotionStatus.ACTIVE);

                when(promotionService.updatePromotionStatus(eq("resto@cupon.com"), eq(id), eq(PromotionStatus.ACTIVE)))
                                .thenReturn(samplePromotion(id));

                mockMvc.perform(patch("/api/v1/promotions/{id}/status", id)
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @WithMockUser(authorities = "ROLE_CLIENTE")
        void updateStatus_whenClientRole_shouldReturn403() throws Exception {
                UUID id = UUID.randomUUID();
                UpdatePromotionStatusRequest request = new UpdatePromotionStatusRequest(PromotionStatus.DISABLED);

                mockMvc.perform(patch("/api/v1/promotions/{id}/status", id)
                                .contentType("application/json")
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isForbidden());
        }

}
