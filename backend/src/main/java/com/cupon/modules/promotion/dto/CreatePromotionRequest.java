package com.cupon.modules.promotion.dto;

import com.cupon.modules.promotion.entity.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

public record CreatePromotionRequest(
        @NotBlank(message = "El título es obligatorio")
        @Size(max = 200)
        String title,

        String description,

        @Size(max = 50)
        String code,

        @NotNull(message = "El tipo de descuento es obligatorio")
        DiscountType discountType,

        @NotNull(message = "El valor del descuento es obligatorio")
        @DecimalMin(value = "0.01", message = "El descuento debe ser mayor a 0")
        BigDecimal discountValue,

        BigDecimal minPurchase,

        @NotNull(message = "La fecha de inicio es obligatoria")
        LocalDateTime startDate,

        @NotNull(message = "La fecha de fin es obligatoria")
        @Future(message = "La fecha de fin debe ser futura")
        LocalDateTime endDate,

        @Min(value = 0)
        int maxRedemptions,

        String imageUrl,

        Set<UUID> categoryIds
) {
}
