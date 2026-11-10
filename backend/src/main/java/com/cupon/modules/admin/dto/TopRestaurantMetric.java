package com.cupon.modules.admin.dto;

import java.util.UUID;

public record TopRestaurantMetric(
        UUID restaurantId,
        String businessName,
        String cuisineType,
        long activePromotions,
        long totalRedemptions
) {
}

