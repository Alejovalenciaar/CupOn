package com.cupon.modules.auth.dto;

public record AuthResponse(
        String token,
        String email,
        String role
) {
}
