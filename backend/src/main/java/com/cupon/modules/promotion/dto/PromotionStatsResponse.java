package com.cupon.modules.promotion.dto;

/**
 * Resumen de las promociones del restaurante autenticado (HU 26).
 * Las pausadas son las DISABLED; totalViews suma las vistas de todas sus promociones.
 */
public record PromotionStatsResponse(
        long active,
        long paused,
        long expired,
        long totalViews
) {
}
