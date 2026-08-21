package com.cupon.modules.restaurant.dto;

import com.cupon.modules.user.entity.ApprovalStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record RestaurantResponse(
        UUID id,
        String businessName,
        String description,
        String address,
        String logoUrl,
        String phoneNumber,
        ApprovalStatus approvalStatus,
        String ownerName,
        LocalDateTime createdAt
) {
}
