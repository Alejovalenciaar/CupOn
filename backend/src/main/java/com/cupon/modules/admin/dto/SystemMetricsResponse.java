package com.cupon.modules.admin.dto;

public record SystemMetricsResponse(
        long totalUsers,
        long totalRestaurants,
        long pendingApprovals,
        long totalPromotions,
        long activePromotions
) {
}
