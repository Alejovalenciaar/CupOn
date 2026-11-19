package com.cupon.modules.admin.dto;

import java.util.List;

public record SystemMetricsResponse(
        long totalUsers,
        long totalRestaurants,
        long pendingApprovals,
        long totalPromotions,
        long activePromotions,
        long totalRedemptions,
        List<TopRestaurantMetric> topRestaurants
) {
    public SystemMetricsResponse(
            long totalUsers,
            long totalRestaurants,
            long pendingApprovals,
            long totalPromotions,
            long activePromotions
    ) {
        this(totalUsers, totalRestaurants, pendingApprovals, totalPromotions, activePromotions, 0L, List.of());
    }
}
