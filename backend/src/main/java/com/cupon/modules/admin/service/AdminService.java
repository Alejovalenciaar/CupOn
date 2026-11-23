package com.cupon.modules.admin.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.modules.admin.dto.ApproveRestaurantRequest;
import com.cupon.modules.admin.dto.SystemMetricsResponse;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.restaurant.dto.RestaurantResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminService {

    PageResponse<RestaurantResponse> getPendingRestaurants(Pageable pageable);

    PageResponse<PromotionResponse> getAllPromotions(Pageable pageable);

    void approveOrRejectRestaurant(UUID restaurantId, ApproveRestaurantRequest request);

    void suspendUser(UUID userId);

    void deletePromotion(UUID promotionId);

    SystemMetricsResponse getSystemMetrics();
}
