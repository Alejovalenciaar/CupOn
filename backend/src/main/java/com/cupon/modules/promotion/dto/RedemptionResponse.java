package com.cupon.modules.promotion.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Respuesta devuelta al canjear un cupón (HU Canje).
 * Contiene el código confirmado y el contador actualizado.
 */
public record RedemptionResponse(
        UUID promotionId,
        String promotionTitle,
        String code,
        String verificationCode,
        int remainingRedemptions,
        LocalDateTime redeemedAt
) {
}
