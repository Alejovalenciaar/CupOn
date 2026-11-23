package com.cupon.modules.promotion.dto;

import com.cupon.modules.promotion.entity.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record RedemptionHistoryResponse(
        UUID id,
        UUID promotionId,
        String promotionTitle,
        String restaurantName,
        String code,
        String verificationCode,
        DiscountType discountType,
        BigDecimal discountValue,
        String customerEmail,
        boolean verified,
        LocalDateTime verifiedAt,
        LocalDateTime redeemedAt
) {
}
