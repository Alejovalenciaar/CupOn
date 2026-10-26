package com.cupon.modules.chatbot.tools;

import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.entity.DiscountType;

/**
 * Formatea una {@link PromotionResponse} como texto plano para incluirla en el
 * contexto que recibe el LLM. Compartido entre {@link PromotionCatalogTools}
 * (catálogo público) y {@link UserAccountTools} (datos del usuario autenticado)
 * para no duplicar la lógica de presentación.
 */
final class PromotionTextFormatter {

    private PromotionTextFormatter() {
    }

    static String formatear(PromotionResponse p) {
        String descuento = p.discountType() == DiscountType.PERCENTAGE
                ? p.discountValue() + "%"
                : "$" + p.discountValue();
        String canjesRestantes = p.maxRedemptions() > 0
                ? String.valueOf(p.maxRedemptions() - p.currentRedemptions())
                : "sin límite";

        return "Título: %s | Restaurante: %s | Estado: %s | Descuento: %s | Compra mínima: %s | Código: %s | Vigente hasta: %s | Canjes restantes: %s"
                .formatted(
                        p.title(),
                        p.restaurantName(),
                        p.status(),
                        descuento,
                        p.minPurchase(),
                        p.code() != null ? p.code() : "sin código",
                        p.endDate(),
                        canjesRestantes);
    }
}
