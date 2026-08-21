package com.cupon.modules.admin.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.admin.dto.ApproveRestaurantRequest;
import com.cupon.modules.admin.dto.SystemMetricsResponse;
import com.cupon.modules.promotion.entity.Promotion;
import com.cupon.modules.promotion.entity.PromotionStatus;
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

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private final RestaurantProfileRepository restaurantProfileRepository;
    private final UserRepository userRepository;
    private final PromotionRepository promotionRepository;
    private final RestaurantMapper restaurantMapper;

    @Override
    public PageResponse<RestaurantResponse> getPendingRestaurants(Pageable pageable) {
        Page<RestaurantResponse> page = restaurantProfileRepository
                .findByApprovalStatus(ApprovalStatus.PENDING, pageable)
                .map(restaurantMapper::toResponse);
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
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", userId));
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
        return new SystemMetricsResponse(
                userRepository.count(),
                restaurantProfileRepository.count(),
                restaurantProfileRepository.countByApprovalStatus(ApprovalStatus.PENDING),
                promotionRepository.count(),
                promotionRepository.countByStatus(PromotionStatus.ACTIVE)
        );
    }
}
