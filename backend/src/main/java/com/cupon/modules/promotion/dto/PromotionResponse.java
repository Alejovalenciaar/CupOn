package com.cupon.modules.promotion.dto;

import com.cupon.modules.promotion.entity.DiscountType;
import com.cupon.modules.promotion.entity.PromotionStatus;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;
import java.util.UUID;

public record PromotionResponse(
                UUID id,
                String title,
                String description,
                String code,
                DiscountType discountType,
                BigDecimal discountValue,
                BigDecimal minPurchase,
                LocalDateTime startDate,
                LocalDateTime endDate,
                int maxRedemptions,
                int currentRedemptions,
                PromotionStatus status,
                String imageUrl,
                String restaurantName,
                UUID restaurantId,
                String restaurantInstagramUrl,
                Set<String> categories,
                LocalDateTime createdAt,
                Set<DayOfWeek> daysOfWeek,
                LocalTime startTime,
                LocalTime endTime,
                boolean currentlyActive,
                long viewCount,
                boolean dynamicPricingEnabled,
                Integer stage1MaxRedemptions,
                BigDecimal stage1DiscountValue,
                BigDecimal stage2DiscountValue,
                Integer currentDynamicStage) {
               public PromotionResponse(
                        UUID id,
                        String title,
                        String description,
                        String code,
                        DiscountType discountType,
                        BigDecimal discountValue,
                        BigDecimal minPurchase,
                        LocalDateTime startDate,
                        LocalDateTime endDate,
                        int maxRedemptions,
                        int currentRedemptions,
                        PromotionStatus status,
                        String imageUrl,
                        String restaurantName,
                        UUID restaurantId,
                        String restaurantInstagramUrl,
                        Set<String> categories,
                        LocalDateTime createdAt,
                        Set<DayOfWeek> daysOfWeek,
                        LocalTime startTime,
                        LocalTime endTime,
                        boolean currentlyActive,
                        long viewCount) {
                this(id, title, description, code, discountType, discountValue, minPurchase,
                                startDate, endDate, maxRedemptions, currentRedemptions, status,
                                imageUrl, restaurantName, restaurantId, restaurantInstagramUrl, categories, createdAt,
                                daysOfWeek, startTime, endTime, currentlyActive, viewCount,
                                false, null, null, null, null);
        }

        public PromotionResponse(
                        UUID id,
                        String title,
                        String description,
                        String code,
                        DiscountType discountType,
                        BigDecimal discountValue,
                        BigDecimal minPurchase,
                        LocalDateTime startDate,
                        LocalDateTime endDate,
                        int maxRedemptions,
                        int currentRedemptions,
                        PromotionStatus status,
                        String imageUrl,
                        String restaurantName,
                        UUID restaurantId,
                        Set<String> categories,
                        LocalDateTime createdAt,
                        Set<DayOfWeek> daysOfWeek,
                        LocalTime startTime,
                        LocalTime endTime,
                        boolean currentlyActive,
                        long viewCount) {
                this(id, title, description, code, discountType, discountValue, minPurchase,
                                startDate, endDate, maxRedemptions, currentRedemptions, status,
                                imageUrl, restaurantName, restaurantId, null, categories, createdAt,
                                daysOfWeek, startTime, endTime, currentlyActive, viewCount,
                                false, null, null, null, null);
        }
}
