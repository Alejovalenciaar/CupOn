package com.cupon.modules.promotion.entity;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class PromotionTest {

    private Promotion buildPromotion(LocalDateTime start, LocalDateTime end, PromotionStatus status) {
        return Promotion.builder()
                .title("2x1 en pizzas")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.TEN)
                .startDate(start)
                .endDate(end)
                .status(status)
                .build();
    }

    @Test
    void isCurrentlyActive_antesDelInicio_esInactiva() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 20, 8, 0);
        LocalDateTime end = LocalDateTime.of(2026, 9, 20, 18, 0);
        Promotion promotion = buildPromotion(start, end, PromotionStatus.ACTIVE);

        LocalDateTime antes = start.minusMinutes(1);

        assertThat(promotion.isCurrentlyActive(antes)).isFalse();
    }

    @Test
    void isCurrentlyActive_duranteElPeriodo_esActiva() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 20, 8, 0);
        LocalDateTime end = LocalDateTime.of(2026, 9, 20, 18, 0);
        Promotion promotion = buildPromotion(start, end, PromotionStatus.ACTIVE);

        LocalDateTime durante = LocalDateTime.of(2026, 9, 20, 12, 0);

        assertThat(promotion.isCurrentlyActive(durante)).isTrue();
    }

    @Test
    void isCurrentlyActive_despuesDelFin_esInactiva() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 20, 8, 0);
        LocalDateTime end = LocalDateTime.of(2026, 9, 20, 18, 0);
        Promotion promotion = buildPromotion(start, end, PromotionStatus.ACTIVE);

        LocalDateTime despues = end.plusMinutes(1);

        assertThat(promotion.isCurrentlyActive(despues)).isFalse();
    }

    @Test
    void isCurrentlyActive_exactamenteEnElInicio_esActiva() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 20, 8, 0);
        LocalDateTime end = LocalDateTime.of(2026, 9, 20, 18, 0);
        Promotion promotion = buildPromotion(start, end, PromotionStatus.ACTIVE);

        assertThat(promotion.isCurrentlyActive(start)).isTrue();
    }

    @Test
    void isCurrentlyActive_exactamenteEnElFin_esActiva() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 20, 8, 0);
        LocalDateTime end = LocalDateTime.of(2026, 9, 20, 18, 0);
        Promotion promotion = buildPromotion(start, end, PromotionStatus.ACTIVE);

        assertThat(promotion.isCurrentlyActive(end)).isTrue();
    }

    @Test
    void isCurrentlyActive_conStatusDistintoDeActivo_esInactivaAunEnPeriodo() {
        LocalDateTime start = LocalDateTime.of(2026, 9, 20, 8, 0);
        LocalDateTime end = LocalDateTime.of(2026, 9, 20, 18, 0);
        Promotion promotion = buildPromotion(start, end, PromotionStatus.DRAFT);

        LocalDateTime durante = LocalDateTime.of(2026, 9, 20, 12, 0);

        assertThat(promotion.isCurrentlyActive(durante)).isFalse();
    }

    @Test
    void isCurrentlyActive_promocionExistenteSoloConFechas_siguesFuncionandoCorrectamente() {
        Promotion promocionExistente = buildPromotion(
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(5),
                PromotionStatus.ACTIVE);

        assertThat(promocionExistente.isCurrentlyActive()).isTrue();
    }
}
