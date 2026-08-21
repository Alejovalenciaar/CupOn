package com.cupon.modules.promotion.dto;

import com.cupon.modules.promotion.entity.PromotionStatus;

import java.util.UUID;

public record FilterPromotionDto(
        UUID categoryId,
        PromotionStatus status,
        String search,
        Double minDiscount,
        Double maxDiscount
) {
}
