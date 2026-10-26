package com.cupon.modules.chatbot.tools;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.data.domain.Pageable;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.entity.DiscountType;
import com.cupon.modules.promotion.entity.PromotionStatus;
import com.cupon.modules.promotion.service.PromotionService;

/**
 * Verifica que el aislamiento por usuario es estructural, no solo de
 * comportamiento: el email que realmente se consulta es siempre el que llega
 * por {@link ToolContext} (inyectado por el servidor), nunca uno distinto,
 * porque la firma del método ni siquiera acepta otro parámetro para eso.
 */
@ExtendWith(MockitoExtension.class)
class UserAccountToolsTest {

    @Mock
    private PromotionService promotionService;

    @InjectMocks
    private UserAccountTools userAccountTools;

    private ToolContext contextoDe(String email) {
        return new ToolContext(Map.of(UserAccountTools.TOOL_CONTEXT_EMAIL_KEY, email));
    }

    private PromotionResponse promocion(String titulo) {
        return new PromotionResponse(
                UUID.randomUUID(), titulo, "desc", "COD", DiscountType.PERCENTAGE,
                new BigDecimal("10.00"), new BigDecimal("0"), LocalDateTime.now(), LocalDateTime.now().plusDays(1),
                0, 0, PromotionStatus.ACTIVE, null, "Restaurante X", UUID.randomUUID(),
                Set.of(), LocalDateTime.now(), Set.of(DayOfWeek.MONDAY), true);
    }

    @Test
    void misFavoritos_sinSesion_pideLoginYNuncaConsultaElRepositorio() {
        String resultado = userAccountTools.misFavoritos(contextoDe(""));

        assertThat(resultado).contains("iniciado sesión");
        verify(promotionService, never()).getMyFavorites(any(), any());
    }

    @Test
    void misFavoritos_conSesion_consultaExactamenteElEmailDelContexto() {
        when(promotionService.getMyFavorites(eq("cliente@cupon.com"), any(Pageable.class)))
                .thenReturn(new PageResponse<>(List.of(promocion("Mi favorita")), 0, 10, 1, 1, true));

        String resultado = userAccountTools.misFavoritos(contextoDe("cliente@cupon.com"));

        assertThat(resultado).contains("Mi favorita");
        verify(promotionService).getMyFavorites(eq("cliente@cupon.com"), any(Pageable.class));
        // Nunca se consulta ningún otro email, sin importar qué diga la pregunta.
        verify(promotionService, never()).getMyFavorites(eq("otro@cupon.com"), any());
    }

    @Test
    void misFavoritos_sinNingunoMarcado_devuelveMensajeClaroYNoInventaDatos() {
        when(promotionService.getMyFavorites(eq("cliente@cupon.com"), any(Pageable.class)))
                .thenReturn(new PageResponse<>(List.of(), 0, 10, 0, 0, true));

        String resultado = userAccountTools.misFavoritos(contextoDe("cliente@cupon.com"));

        assertThat(resultado).isEqualTo("Todavía no tienes ninguna promoción marcada como favorita.");
    }

    @Test
    void misPromociones_sinSesion_pideLoginYNuncaConsultaElRepositorio() {
        String resultado = userAccountTools.misPromociones(contextoDe(""));

        assertThat(resultado).contains("iniciado sesión");
        verify(promotionService, never()).getMyPromotions(any(), any());
    }

    @Test
    void misPromociones_conSesion_consultaExactamenteElEmailDelContexto() {
        when(promotionService.getMyPromotions(eq("resto@cupon.com"), any(Pageable.class)))
                .thenReturn(new PageResponse<>(List.of(promocion("Mi promo")), 0, 10, 1, 1, true));

        String resultado = userAccountTools.misPromociones(contextoDe("resto@cupon.com"));

        assertThat(resultado).contains("Mi promo");
        verify(promotionService).getMyPromotions(eq("resto@cupon.com"), any(Pageable.class));
    }

    @Test
    void misPromociones_cuentaSinPerfilDeRestaurante_devuelveMensajeClaroEnVezDeFallar() {
        when(promotionService.getMyPromotions(eq("cliente@cupon.com"), any(Pageable.class)))
                .thenThrow(new ResourceNotFoundException("Perfil de restaurante", "userId", "x"));

        String resultado = userAccountTools.misPromociones(contextoDe("cliente@cupon.com"));

        assertThat(resultado).contains("cuentas de restaurante");
    }
}
