package com.cupon.modules.promotion.controller;

import com.cupon.config.SecurityConfig;
import com.cupon.modules.auth.service.JwtService;
import com.cupon.modules.promotion.dto.CategoryResponse;
import com.cupon.modules.promotion.service.PromotionService;
import com.cupon.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CategoryController.class)
@Import(SecurityConfig.class)
class CategoryControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockitoBean
        private PromotionService promotionService;

        @MockitoBean
        private JwtService jwtService;

        @MockitoBean
        private UserRepository userRepository;

        @Test
        void getAll_esPublico_devuelveCategorias() throws Exception {
                UUID id = UUID.randomUUID();
                when(promotionService.getCategories())
                                .thenReturn(List.of(new CategoryResponse(id, "Sushi", "Rolls")));

                mockMvc.perform(get("/api/v1/categories"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data[0].id").value(id.toString()))
                                .andExpect(jsonPath("$.data[0].name").value("Sushi"));
        }
}
