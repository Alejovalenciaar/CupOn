package com.cupon.common.exception;

/**
 * Excepción lanzada cuando un cupón no puede ser canjeado:
 * - Promoción no activa
 * - Cupón agotado (maxRedemptions alcanzado)
 * - Cupón vencido
 */
public class PromotionNotRedeemableException extends RuntimeException {
    public PromotionNotRedeemableException(String message) {
        super(message);
    }
}
