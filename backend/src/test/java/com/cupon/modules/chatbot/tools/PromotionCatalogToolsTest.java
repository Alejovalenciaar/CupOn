package com.cupon.modules.chatbot.tools;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import com.cupon.common.dto.PageResponse;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.entity.DiscountType;
import com.cupon.modules.promotion.service.PromotionService;
import com.cupon.modules.restaurant.dto.RestaurantResponse;
import com.cupon.modules.restaurant.service.RestaurantService;
import com.cupon.modules.user.entity.ApprovalStatus;

@ExtendWith(MockitoExtension.class)
class PromotionCatalogToolsTest {

    @Mock
    private PromotionService promotionService;

    @Mock
    private RestaurantService restaurantService;

    @InjectMocks
    private PromotionCatalogTools promotionCatalogTools;

    private PromotionResponse promocionPizza() {
        return new PromotionResponse(
                UUID.randomUUID(), "2x1 en Pizzas", "Pizzas artesanales", "PIZZA2X1",
                DiscountType.PERCENTAGE, new BigDecimal("50.00"), new BigDecimal("36000.00"),
                LocalDateTime.now(), LocalDateTime.now().plusDays(90),
                150, 0, com.cupon.modules.promotion.entity.PromotionStatus.ACTIVE, null,
                "Bella Italia Trattoria", UUID.randomUUID(), Set.of("Italiana"),
                LocalDateTime.now(), Set.of(DayOfWeek.MONDAY), null, null, true);
    }

    private RestaurantResponse restauranteItaliano() {
        return new RestaurantResponse(
                UUID.randomUUID(), "Bella Italia Trattoria",
                "Rincón gastronómico italiano con pastas artesanales",
                "Carrera 11 # 85-32, Bogotá", null, null,
                ApprovalStatus.APPROVED, "Gianluigi Rossi", LocalDateTime.now());
    }

    @Test
    void buscarPromociones_sinResultados_devuelveMensajeClaroYNoInventaDatos() {
        when(promotionService.getActivePromotions(eq("sushi"), isNull(), any(Pageable.class)))
                .thenReturn(new PageResponse<>(List.of(), 0, 10, 0, 0, true));

        String resultado = promotionCatalogTools.buscarPromociones("sushi", null);

        assertThat(resultado).isEqualTo("No se encontraron promociones activas que coincidan con esos criterios.");
    }

    @Test
    void buscarPromociones_conResultados_incluyeLosDatosRealesDeLaPromocion() {
        when(promotionService.getActivePromotions(eq("pizza"), isNull(), any(Pageable.class)))
                .thenReturn(new PageResponse<>(List.of(promocionPizza()), 0, 10, 1, 1, true));

        String resultado = promotionCatalogTools.buscarPromociones("pizza", null);

        assertThat(resultado)
                .contains("2x1 en Pizzas")
                .contains("Bella Italia Trattoria")
                .contains("50.00%")
                .contains("PIZZA2X1")
                .contains("150"); // canjes restantes = maxRedemptions - currentRedemptions
    }

    @Test
    void buscarPromociones_conDiaSemanaInvalido_ignoraElFiltroEnVezDeFallar() {
        when(promotionService.getActivePromotions(any(), isNull(), any(Pageable.class)))
                .thenReturn(new PageResponse<>(List.of(), 0, 10, 0, 0, true));

        promotionCatalogTools.buscarPromociones(null, "no-es-un-dia-valido");

        // El día inválido se traduce a null en vez de lanzar una excepción que
        // interrumpiría la respuesta del chatbot.
        org.mockito.Mockito.verify(promotionService)
                .getActivePromotions(isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void buscarRestaurantes_conCoincidenciaExacta_devuelveSusDatos() {
        when(restaurantService.getApprovedRestaurants(any(Pageable.class)))
                .thenReturn(new PageResponse<>(List.of(restauranteItaliano()), 0, 50, 1, 1, true));

        String resultado = promotionCatalogTools.buscarRestaurantes("italiano");

        assertThat(resultado)
                .contains("Bella Italia Trattoria")
                .contains("Carrera 11 # 85-32, Bogotá");
    }

    @Test
    void buscarRestaurantes_conPluralEnEspanol_coincidePorRaizDePalabra() {
        when(restaurantService.getApprovedRestaurants(any(Pageable.class)))
                .thenReturn(new PageResponse<>(List.of(restauranteItaliano()), 0, 50, 1, 1, true));

        // "italianos" (plural) no aparece literalmente en "italiano"/"Italia",
        // pero debe igual encontrar el restaurante por coincidencia de raíz.
        String resultado = promotionCatalogTools.buscarRestaurantes("italianos");

        assertThat(resultado).contains("Bella Italia Trattoria");
    }

    @Test
    void buscarRestaurantes_sinCoincidencias_devuelveMensajeClaroYNoInventaDatos() {
        when(restaurantService.getApprovedRestaurants(any(Pageable.class)))
                .thenReturn(new PageResponse<>(List.of(restauranteItaliano()), 0, 50, 1, 1, true));

        String resultado = promotionCatalogTools.buscarRestaurantes("mexicano");

        assertThat(resultado).isEqualTo("No se encontraron restaurantes que coincidan con esa búsqueda.");
    }
}
