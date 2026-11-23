package com.cupon.modules.promotion.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyRedemptionRequest(
        @NotBlank(message = "El código de verificación es obligatorio")
        String verificationCode
) {
}
