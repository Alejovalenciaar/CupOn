package com.cupon.modules.promotion.dto;

import java.util.UUID;

public record CategoryResponse(
        UUID id,
        String name,
        String description
) {
}
