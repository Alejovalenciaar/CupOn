package com.cupon.modules.promotion.dto;

import com.cupon.modules.promotion.entity.DiscountType;
import com.cupon.modules.promotion.entity.PromotionStatus;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

public record PromotionResponse(
        UUID id,
        String title,
        String description,
        String code,
        DiscountType discountType,
        BigDecimal discountValue,
        BigDecimal minPurchase,
        LocalDateTime startDate,
        LocalDateTime endDate,
        int maxRedemptions,
        int currentRedemptions,
        PromotionStatus status,
        String imageUrl,
        String restaurantName,
        UUID restaurantId,
        Set<String> categories,
        LocalDateTime createdAt,
        Set<DayOfWeek> daysOfWeek
) {
}
