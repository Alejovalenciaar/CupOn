package com.cupon.modules.user.dto;

import com.cupon.modules.user.entity.Role;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserProfileResponse(
                UUID id,
                String email,
                String firstName,
                String lastName,
                String phoneNumber,
                Role role,
                boolean enabled,
                LocalDateTime createdAt) {
}
