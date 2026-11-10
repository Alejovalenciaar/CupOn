package com.cupon.modules.restaurant.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.modules.restaurant.dto.RestaurantResponse;
import com.cupon.modules.restaurant.dto.UpdateRestaurantDto;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface RestaurantService {

    PageResponse<RestaurantResponse> getApprovedRestaurants(String search, String cuisineType, Pageable pageable);

    RestaurantResponse getRestaurantById(UUID id);

    RestaurantResponse getMyRestaurant(String userEmail);

    RestaurantResponse updateMyRestaurant(String userEmail, UpdateRestaurantDto request);

    void toggleFavoriteRestaurant(String userEmail, UUID restaurantId);

    PageResponse<RestaurantResponse> getMyFavoriteRestaurants(String userEmail, Pageable pageable);
}
