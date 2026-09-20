package com.cupon.modules.promotion.dto;

import com.cupon.modules.promotion.entity.PromotionStatus;

import jakarta.validation.constraints.NotNull;

public record UpdatePromotionStatusRequest(
        @NotNull(message = "El estado de la promocion debe ser obligatorio") PromotionStatus status) {
}
