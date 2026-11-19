package com.cupon.modules.restaurant.dto;

import com.cupon.modules.user.entity.ApprovalStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record RestaurantResponse(
                UUID id,
                String businessName,
                String description,
                String cuisineType,
                String address,
                Double latitude,
                Double longitude,
                String logoUrl,
                String phoneNumber,
                ApprovalStatus approvalStatus,
                UUID userId,
                Boolean ownerEnabled,
                String ownerName,
                LocalDateTime createdAt) {
}
