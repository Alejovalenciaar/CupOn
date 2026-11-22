package com.cupon.modules.promotion.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.modules.promotion.dto.CategoryResponse;
import com.cupon.modules.promotion.dto.CreatePromotionRequest;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.dto.PromotionStatsResponse;
import com.cupon.modules.promotion.dto.RedemptionHistoryResponse;
import com.cupon.modules.promotion.dto.RedemptionResponse;
import com.cupon.modules.promotion.entity.PromotionStatus;

import org.springframework.data.domain.Pageable;

import java.time.DayOfWeek;
import java.util.List;
import java.util.UUID;

public interface PromotionService {

    /** Valor de {@code sort} que ordena el catálogo por popularidad (canjes + favoritos + vistas). */
    String SORT_POPULAR = "popular";

    /**
     * Lista promociones activas filtradas. Con {@code sort = "popular"} se ordena por popularidad
     * e ignora el Sort del Pageable; con cualquier otro valor se respeta el Pageable tal cual.
     */
    PageResponse<PromotionResponse> getActivePromotions(String search, DayOfWeek dayOfWeek, UUID categoryId,
            String sort, Pageable pageable);

    List<CategoryResponse> getCategories();

    /** Devuelve el detalle e incrementa su contador de vistas. */
    PromotionResponse getPromotionById(UUID id);

    PromotionResponse createPromotion(String userEmail, CreatePromotionRequest request);

    PromotionResponse updatePromotion(String userEmail, UUID promotionId, CreatePromotionRequest request);

    void deletePromotion(String userEmail, UUID promotionId);

    void toggleFavorite(String userEmail, UUID promotionId);

    PageResponse<PromotionResponse> getMyFavorites(String userEmail, Pageable pageable);

    PageResponse<PromotionResponse> getMyPromotions(String userEmail, Pageable pageable);

    /** Promociones activas, pausadas y expiradas del restaurante, y el total de vistas (HU 26). */
    PromotionStatsResponse getMyPromotionStats(String userEmail);

    PromotionResponse updatePromotionStatus(String userEmail, UUID promotionId, PromotionStatus neStatus);

    /**
     * Canjea un cupón: valida disponibilidad, registra historial con código de verificación
     * y atómicamente incrementa currentRedemptions.
     *
     * @throws com.cupon.common.exception.PromotionNotRedeemableException si el cupón no está activo, está agotado o ya fue canjeado por el cliente
     */
    RedemptionResponse redeemPromotion(UUID promotionId, String userEmail);

    default RedemptionResponse redeemPromotion(UUID promotionId) {
        return redeemPromotion(promotionId, null);
    }

    /** Historial de canjes del cliente autenticado. */
    PageResponse<RedemptionHistoryResponse> getMyRedemptions(String userEmail, Pageable pageable);

    /** Historial de canjes de las promociones del restaurante autenticado. */
    PageResponse<RedemptionHistoryResponse> getRestaurantRedemptions(String userEmail, Pageable pageable);

    /** Valida en caja el código único de verificación de un canje perteneciente al restaurante. */
    RedemptionHistoryResponse verifyRedemption(String userEmail, String verificationCode);
}
