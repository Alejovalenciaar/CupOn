package com.cupon.modules.chatbot.tools;

import java.time.DayOfWeek;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import com.cupon.common.dto.PageResponse;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.service.PromotionService;
import com.cupon.modules.restaurant.dto.RestaurantResponse;
import com.cupon.modules.restaurant.service.RestaurantService;

import lombok.RequiredArgsConstructor;

/**
 * Tools (function calling) que el chatbot invoca para responder con datos reales
 * y vigentes del catálogo público, en vez de la base de conocimiento estática (RAG).
 *
 * <p>Solo exponen información ya pública (promociones activas, restaurantes
 * aprobados) — los mismos datos que {@code GET /api/v1/promotions} y
 * {@code GET /api/v1/restaurants} sin autenticación. No exponen datos por-usuario
 * (favoritos, "mis promociones"): eso requiere el contexto del usuario autenticado
 * y queda para una fase posterior.
 */
@Component
@RequiredArgsConstructor
public class PromotionCatalogTools {

    private static final int MAX_RESULTADOS = 10;

    private final PromotionService promotionService;
    private final RestaurantService restaurantService;

    @Tool(description = "Busca promociones ACTIVAS y vigentes en el catálogo público de CupOn en este momento. "
            + "Úsalo para cualquier pregunta sobre qué promociones o cupones hay disponibles, de qué tipo de "
            + "comida, o qué día aplican. Nunca inventes promociones: si esta herramienta no devuelve resultados, "
            + "significa que no existen.")
    public String buscarPromociones(
            @ToolParam(required = false, description = "Texto a buscar en el título o descripción de la "
                    + "promoción, por ejemplo 'sushi', 'pizza' o 'hamburguesa'. Déjalo vacío para no filtrar por texto.")
            String busqueda,
            @ToolParam(required = false, description = "Día de la semana en inglés y mayúsculas: MONDAY, TUESDAY, "
                    + "WEDNESDAY, THURSDAY, FRIDAY, SATURDAY o SUNDAY. Déjalo vacío para no filtrar por día.")
            String diaSemana) {

        DayOfWeek dia = parseDiaSemana(diaSemana);
        String textoBusqueda = (busqueda == null || busqueda.isBlank()) ? null : busqueda.trim();

        PageResponse<PromotionResponse> resultado = promotionService.getActivePromotions(
                textoBusqueda, dia, PageRequest.of(0, MAX_RESULTADOS));

        if (resultado.content().isEmpty()) {
            return "No se encontraron promociones activas que coincidan con esos criterios.";
        }

        return resultado.content().stream()
                .map(PromotionTextFormatter::formatear)
                .collect(Collectors.joining("\n---\n"));
    }

    @Tool(description = "Busca restaurantes aprobados en el directorio público de CupOn por nombre o por parte "
            + "de su descripción. Úsalo para preguntas sobre qué restaurantes existen, su dirección o su "
            + "especialidad. Nunca inventes restaurantes: si esta herramienta no devuelve resultados, significa "
            + "que no existen.")
    public String buscarRestaurantes(
            @ToolParam(description = "Texto a buscar en el nombre o la descripción del restaurante, por "
                    + "ejemplo 'sushi', 'italiana' o el nombre propio del restaurante.")
            String busqueda) {

        PageResponse<RestaurantResponse> resultado =
                restaurantService.getApprovedRestaurants(null, null, PageRequest.of(0, 50));

        List<RestaurantResponse> coincidencias = resultado.content().stream()
                .filter(r -> contieneTexto(r.businessName(), busqueda)
                        || contieneTexto(r.description(), busqueda)
                        || contieneTexto(r.cuisineType(), busqueda))
                .limit(MAX_RESULTADOS)
                .toList();

        if (coincidencias.isEmpty()) {
            return "No se encontraron restaurantes que coincidan con esa búsqueda.";
        }

        return coincidencias.stream()
                .map(this::formatearRestaurante)
                .collect(Collectors.joining("\n---\n"));
    }

    private boolean contieneTexto(String texto, String busqueda) {
        if (texto == null || busqueda == null || busqueda.isBlank()) {
            return false;
        }
        String textoNorm = texto.toLowerCase();
        String busquedaNorm = busqueda.toLowerCase().trim();
        if (textoNorm.contains(busquedaNorm)) {
            return true;
        }
        // Coincidencia por raíz de palabra (p. ej. "italianos" ~ "italiano"/"Italia"):
        // tolera variaciones de género/número del español que una comparación
        // literal de substring no captura, sin necesidad de un stemmer completo.
        int longitudRaiz = Math.min(5, busquedaNorm.length());
        return longitudRaiz >= 4 && textoNorm.contains(busquedaNorm.substring(0, longitudRaiz));
    }

    private DayOfWeek parseDiaSemana(String diaSemana) {
        if (diaSemana == null || diaSemana.isBlank()) {
            return null;
        }
        try {
            return DayOfWeek.valueOf(diaSemana.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String formatearRestaurante(RestaurantResponse r) {
        return "Nombre: %s | Dirección: %s | Descripción: %s"
                .formatted(r.businessName(), r.address(), r.description());
    }
}
