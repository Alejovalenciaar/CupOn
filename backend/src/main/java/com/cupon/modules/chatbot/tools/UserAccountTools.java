package com.cupon.modules.chatbot.tools;

import java.util.stream.Collectors;

import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.service.PromotionService;

import lombok.RequiredArgsConstructor;

/**
 * Tools que exponen datos privados del usuario que está hablando con el chatbot
 * ("mis favoritos", "mis promociones").
 *
 * <p><b>Aislamiento por diseño, no por confianza en el modelo:</b> estos métodos
 * reciben un {@link ToolContext}, un parámetro que Spring AI inyecta directamente
 * desde el servidor y que el LLM nunca ve ni puede rellenar (no forma parte del
 * esquema JSON que se le ofrece como argumentos de la función). El correo del
 * usuario autenticado llega exclusivamente por ahí — nunca como un
 * {@code @ToolParam} que el modelo pudiera completar con el identificador de
 * otra persona. Así, aunque el usuario intente manipular al chatbot pidiéndole
 * "los favoritos del cliente X", no existe ningún parámetro por el que ese dato
 * pueda viajar hasta la consulta real.
 *
 * <p>El email se coloca en el contexto en {@code ChatbotService#preguntar}, con
 * el mismo valor que ya resuelve {@code ChatbotController} a partir del
 * {@code Authentication} real de la petición HTTP — igual que cualquier otro
 * endpoint "/me" del resto de la aplicación.
 */
@Component
@RequiredArgsConstructor
public class UserAccountTools {

    public static final String TOOL_CONTEXT_EMAIL_KEY = "emailUsuarioAutenticado";

    private static final int MAX_RESULTADOS = 10;

    private static final String MENSAJE_REQUIERE_LOGIN =
            "Esta información requiere haber iniciado sesión en CupOn. Indícale al usuario que inicie sesión.";

    private final PromotionService promotionService;

    @Tool(description = "Devuelve las promociones que el CLIENTE que está conversando contigo ahora mismo ha "
            + "marcado como favoritas. Solo funciona si inició sesión como cliente. Nunca se usa para consultar "
            + "los favoritos de otra persona: siempre son los del usuario de esta conversación.")
    public String misFavoritos(ToolContext toolContext) {
        String email = emailAutenticado(toolContext);
        if (email == null) {
            return MENSAJE_REQUIERE_LOGIN;
        }

        PageResponse<PromotionResponse> resultado =
                promotionService.getMyFavorites(email, PageRequest.of(0, MAX_RESULTADOS));

        if (resultado.content().isEmpty()) {
            return "Todavía no tienes ninguna promoción marcada como favorita.";
        }

        return resultado.content().stream()
                .map(PromotionTextFormatter::formatear)
                .collect(Collectors.joining("\n---\n"));
    }

    @Tool(description = "Devuelve las promociones publicadas por el RESTAURANTE que está conversando contigo "
            + "ahora mismo (incluye borradores y pausadas, no solo las activas). Solo funciona si inició sesión "
            + "con una cuenta de restaurante. Nunca se usa para consultar las promociones de otro restaurante: "
            + "siempre son las del restaurante de esta conversación.")
    public String misPromociones(ToolContext toolContext) {
        String email = emailAutenticado(toolContext);
        if (email == null) {
            return MENSAJE_REQUIERE_LOGIN;
        }

        try {
            PageResponse<PromotionResponse> resultado =
                    promotionService.getMyPromotions(email, PageRequest.of(0, MAX_RESULTADOS));

            if (resultado.content().isEmpty()) {
                return "Este restaurante todavía no tiene ninguna promoción publicada.";
            }

            return resultado.content().stream()
                    .map(PromotionTextFormatter::formatear)
                    .collect(Collectors.joining("\n---\n"));
        } catch (ResourceNotFoundException ex) {
            return "Esta cuenta no tiene un perfil de restaurante asociado: esta función solo está disponible "
                    + "para cuentas de restaurante.";
        }
    }

    private String emailAutenticado(ToolContext toolContext) {
        Object valor = toolContext.getContext().get(TOOL_CONTEXT_EMAIL_KEY);
        return (valor instanceof String email && !email.isBlank()) ? email : null;
    }
}
