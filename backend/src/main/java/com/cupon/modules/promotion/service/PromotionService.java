package com.cupon.modules.promotion.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.modules.promotion.dto.CreatePromotionRequest;
import com.cupon.modules.promotion.dto.PromotionResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface PromotionService {

    PageResponse<PromotionResponse> getActivePromotions(String search, Pageable pageable);

    PromotionResponse getPromotionById(UUID id);

    PromotionResponse createPromotion(String userEmail, CreatePromotionRequest request);

    PromotionResponse updatePromotion(String userEmail, UUID promotionId, CreatePromotionRequest request);

    void deletePromotion(String userEmail, UUID promotionId);

    void toggleFavorite(String userEmail, UUID promotionId);

    PageResponse<PromotionResponse> getMyFavorites(String userEmail, Pageable pageable);

    PageResponse<PromotionResponse> getMyPromotions(String userEmail, Pageable pageable);
}
