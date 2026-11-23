package com.cupon.modules.chatbot.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cupon.config.SecurityConfig;
import com.cupon.modules.auth.service.JwtService;
import com.cupon.modules.chatbot.service.ChatbotService;
import com.cupon.modules.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * No llama al modelo real de Groq (eso se verificó manualmente, ver notas de la
 * Fase 5): aquí solo se verifica el contrato HTTP del endpoint y que la consulta se
 * asocie correctamente al usuario autenticado o quede anónima para invitados.
 */
@WebMvcTest(ChatbotController.class)
@Import(SecurityConfig.class)
class ChatbotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ChatbotService chatbotService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void chat_esPublico_devuelve200YNoAsociaUsuario() throws Exception {
        when(chatbotService.preguntar(eq("¿Qué es CupOn?"), isNull()))
                .thenReturn("CupOn es un directorio de promociones para restaurantes.");

        mockMvc.perform(post("/api/v1/chatbot/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new com.cupon.modules.chatbot.dto.ChatRequest("¿Qué es CupOn?"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.respuesta").value(
                        "CupOn es un directorio de promociones para restaurantes."));

        verify(chatbotService).preguntar(eq("¿Qué es CupOn?"), isNull());
    }

    @Test
    void chat_conPreguntaVacia_devuelve400() throws Exception {
        mockMvc.perform(post("/api/v1/chatbot/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new com.cupon.modules.chatbot.dto.ChatRequest(""))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "cliente@cupon.com", authorities = "ROLE_CLIENTE")
    void chat_conUsuarioAutenticado_asociaLaConsultaAlCorreo() throws Exception {
        when(chatbotService.preguntar(eq("¿Cómo canjeo un cupón?"), eq("cliente@cupon.com")))
                .thenReturn("Se canjea directamente en el restaurante.");

        mockMvc.perform(post("/api/v1/chatbot/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new com.cupon.modules.chatbot.dto.ChatRequest("¿Cómo canjeo un cupón?"))))
                .andExpect(status().isOk());

        verify(chatbotService).preguntar(eq("¿Cómo canjeo un cupón?"), eq("cliente@cupon.com"));
    }
}
