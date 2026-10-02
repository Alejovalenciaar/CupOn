package com.cupon.modules.promotion.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.modules.promotion.dto.CreatePromotionRequest;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.dto.RedemptionResponse;
import com.cupon.modules.promotion.entity.PromotionStatus;

import org.springframework.data.domain.Pageable;

import java.time.DayOfWeek;
import java.util.UUID;

public interface PromotionService {

    PageResponse<PromotionResponse> getActivePromotions(String search, DayOfWeek dayOfWeek, Pageable pageable);

    PromotionResponse getPromotionById(UUID id);

    PromotionResponse createPromotion(String userEmail, CreatePromotionRequest request);

    PromotionResponse updatePromotion(String userEmail, UUID promotionId, CreatePromotionRequest request);

    void deletePromotion(String userEmail, UUID promotionId);

    void toggleFavorite(String userEmail, UUID promotionId);

    PageResponse<PromotionResponse> getMyFavorites(String userEmail, Pageable pageable);

    PageResponse<PromotionResponse> getMyPromotions(String userEmail, Pageable pageable);

    PromotionResponse updatePromotionStatus(String userEmail, UUID promotionId, PromotionStatus neStatus);

    /**
     * Canjea un cupón: valida disponibilidad y atomicamente incrementa currentRedemptions.
     * Accesible por cualquier usuario autenticado (CLIENTE o público anónimo).
     *
     * @throws com.cupon.common.exception.PromotionNotRedeemableException si el cupón no está activo o está agotado
     */
    RedemptionResponse redeemPromotion(UUID promotionId);
}
