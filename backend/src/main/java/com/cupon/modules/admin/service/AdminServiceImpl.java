package com.cupon.modules.admin.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.admin.dto.ApproveRestaurantRequest;
import com.cupon.modules.admin.dto.SystemMetricsResponse;
import com.cupon.modules.admin.dto.TopRestaurantMetric;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.entity.Promotion;
import com.cupon.modules.promotion.entity.PromotionStatus;
import com.cupon.modules.promotion.mapper.PromotionMapper;
import com.cupon.modules.promotion.repository.PromotionRepository;
import com.cupon.modules.restaurant.dto.RestaurantResponse;
import com.cupon.modules.restaurant.mapper.RestaurantMapper;
import com.cupon.modules.user.entity.ApprovalStatus;
import com.cupon.modules.user.entity.RestaurantProfile;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.repository.RestaurantProfileRepository;
import com.cupon.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

        private final RestaurantProfileRepository restaurantProfileRepository;
        private final UserRepository userRepository;
        private final PromotionRepository promotionRepository;
        private final RestaurantMapper restaurantMapper;
        private final PromotionMapper promotionMapper;

        @Override
        public PageResponse<RestaurantResponse> getPendingRestaurants(Pageable pageable) {
                Page<RestaurantResponse> page = restaurantProfileRepository
                                .findByApprovalStatus(ApprovalStatus.PENDING, pageable)
                                .map(restaurantMapper::toResponse);
                return PageResponse.of(page);
        }

        @Override
        public PageResponse<PromotionResponse> getAllPromotions(Pageable pageable) {
                Page<PromotionResponse> page = promotionRepository
                                .findAll(pageable)
                                .map(promotionMapper::toResponse);
                return PageResponse.of(page);
        }

        @Override
        @Transactional
        public void approveOrRejectRestaurant(UUID restaurantId, ApproveRestaurantRequest request) {
                RestaurantProfile profile = restaurantProfileRepository.findById(restaurantId)
                                .orElseThrow(() -> new ResourceNotFoundException("Restaurante", "id", restaurantId));

                if (request.approved()) {
                        profile.setApprovalStatus(ApprovalStatus.APPROVED);
                        profile.setRejectionReason(null);
                } else {
                        profile.setApprovalStatus(ApprovalStatus.REJECTED);
                        profile.setRejectionReason(request.rejectionReason());
                }

                restaurantProfileRepository.save(profile);
        }

        @Override
        @Transactional
        public void suspendUser(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseGet(() -> restaurantProfileRepository.findById(userId)
                                                .map(RestaurantProfile::getUser)
                                                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id",
                                                                userId)));
                user.setEnabled(!user.isEnabled());
                userRepository.save(user);
        }

        @Override
        @Transactional
        @CacheEvict(value = "promotions", allEntries = true)
        public void deletePromotion(UUID promotionId) {
                Promotion promotion = promotionRepository.findById(promotionId)
                                .orElseThrow(() -> new ResourceNotFoundException("Promoción", "id", promotionId));
                promotionRepository.delete(promotion);
        }

    @Override
    public SystemMetricsResponse getSystemMetrics() {
        List<Promotion> promotions = promotionRepository.findAll();

        long totalRedemptions = promotions.stream()
                .mapToLong(Promotion::getCurrentRedemptions)
                .sum();

        Map<RestaurantProfile, List<Promotion>> byRestaurant = promotions.stream()
                .filter(p -> p.getRestaurantProfile() != null)
                .collect(Collectors.groupingBy(Promotion::getRestaurantProfile));

        List<TopRestaurantMetric> topRestaurants = byRestaurant.entrySet().stream()
                .map(entry -> {
                    RestaurantProfile rest = entry.getKey();
                    List<Promotion> restPromos = entry.getValue();
                    long activeCount = restPromos.stream()
                            .filter(p -> p.getStatus() == PromotionStatus.ACTIVE)
                            .count();
                    long redemptions = restPromos.stream()
                            .mapToLong(Promotion::getCurrentRedemptions)
                            .sum();
                    return new TopRestaurantMetric(
                            rest.getId(),
                            rest.getBusinessName(),
                            rest.getCuisineType(),
                            activeCount,
                            redemptions
                    );
                })
                .sorted(Comparator.comparingLong(TopRestaurantMetric::totalRedemptions).reversed()
                        .thenComparing(Comparator.comparingLong(TopRestaurantMetric::activePromotions).reversed()))
                .limit(5)
                .toList();

        return new SystemMetricsResponse(
                userRepository.count(),
                restaurantProfileRepository.count(),
                restaurantProfileRepository.countByApprovalStatus(ApprovalStatus.PENDING),
                promotionRepository.count(),
                promotionRepository.countByStatus(PromotionStatus.ACTIVE),
                totalRedemptions,
                topRestaurants
        );
    }
}
