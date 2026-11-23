package com.cupon.modules.chatbot.controller;

import com.cupon.common.dto.ApiResponse;
import com.cupon.modules.chatbot.dto.ChatRequest;
import com.cupon.modules.chatbot.dto.ChatResponse;
import com.cupon.modules.chatbot.service.ChatbotService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chatbot")
@RequiredArgsConstructor
@Tag(name = "Chatbot", description = "Asistente conversacional RAG de CupOn")
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/chat")
    @Operation(summary = "Realizar una pregunta al chatbot (público; si hay sesión, la consulta queda asociada al usuario)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Respuesta generada"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Pregunta inválida")
    })
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            Authentication authentication,
            @Valid @RequestBody ChatRequest request) {

        String email = emailDelUsuarioAutenticadoOrNull(authentication);
        String respuesta = chatbotService.preguntar(request.pregunta(), email);

        return ResponseEntity.ok(ApiResponse.success(new ChatResponse(respuesta)));
    }

    /**
     * Este endpoint es público: Spring Security igual rellena un
     * {@link AnonymousAuthenticationToken} para invitados (no {@code null}), así que
     * hay que descartarlo explícitamente para no asociar su consulta a un usuario real.
     */
    private String emailDelUsuarioAutenticadoOrNull(Authentication authentication) {
        boolean esInvitado = authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken;
        return esInvitado ? null : authentication.getName();
    }
}
