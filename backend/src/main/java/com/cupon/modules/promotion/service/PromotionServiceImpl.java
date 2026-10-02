package com.cupon.modules.promotion.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.promotion.dto.CreatePromotionRequest;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.entity.Category;
import com.cupon.modules.promotion.entity.Favorite;
import com.cupon.modules.promotion.entity.Promotion;
import com.cupon.modules.promotion.entity.PromotionStatus;
import com.cupon.modules.promotion.mapper.PromotionMapper;
import com.cupon.modules.promotion.repository.CategoryRepository;
import com.cupon.modules.promotion.repository.FavoriteRepository;
import com.cupon.modules.promotion.repository.PromotionRepository;
import com.cupon.modules.user.entity.RestaurantProfile;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.repository.RestaurantProfileRepository;
import com.cupon.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final CategoryRepository categoryRepository;
    private final FavoriteRepository favoriteRepository;
    private final RestaurantProfileRepository restaurantProfileRepository;
    private final UserRepository userRepository;
    private final PromotionMapper promotionMapper;

    @Override
    @Cacheable(value = "promotions", key = "'active_' + #search + '_' + #dayOfWeek + '_' + #pageable.pageNumber")
    public PageResponse<PromotionResponse> getActivePromotions(String search, DayOfWeek dayOfWeek, Pageable pageable) {
        String normalizedSearch = (search != null && !search.isBlank()) ? search : null;
        Page<Promotion> page = promotionRepository.search(PromotionStatus.ACTIVE, normalizedSearch, dayOfWeek,
                pageable);
        return PageResponse.of(page.map(promotionMapper::toResponse));
    }

    @Override
    public PromotionResponse getPromotionById(UUID id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promoción", "id", id));
        return promotionMapper.toResponse(promotion);
    }

    @Override
    @Transactional
    @CacheEvict(value = "promotions", allEntries = true)
    public PromotionResponse createPromotion(String userEmail, CreatePromotionRequest request) {
        RestaurantProfile restaurant = getRestaurantProfile(userEmail);

        Promotion promotion = Promotion.builder()
                .restaurantProfile(restaurant)
                .title(request.title())
                .description(request.description())
                .code(request.code())
                .discountType(request.discountType())
                .discountValue(request.discountValue())
                .minPurchase(request.minPurchase())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .maxRedemptions(request.maxRedemptions())
                .imageUrl(request.imageUrl())
                .status(PromotionStatus.DRAFT)
                .build();

        if (request.categoryIds() != null && !request.categoryIds().isEmpty()) {
            Set<Category> categories = new HashSet<>(categoryRepository.findAllById(request.categoryIds()));
            promotion.setCategories(categories);
        }

        if (request.daysOfWeek() != null) {
            promotion.setDaysOfWeek(new HashSet<>(request.daysOfWeek()));
        }

        Promotion saved = promotionRepository.save(promotion);
        return promotionMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "promotions", allEntries = true)
    public PromotionResponse updatePromotion(String userEmail, UUID promotionId, CreatePromotionRequest request) {
        RestaurantProfile restaurant = getRestaurantProfile(userEmail);
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("Promoción", "id", promotionId));

        if (!promotion.getRestaurantProfile().getId().equals(restaurant.getId())) {
            throw new AccessDeniedException("No tienes permisos para editar esta promoción");
        }

        promotion.setTitle(request.title());
        promotion.setDescription(request.description());
        promotion.setCode(request.code());
        promotion.setDiscountType(request.discountType());
        promotion.setDiscountValue(request.discountValue());
        promotion.setMinPurchase(request.minPurchase());
        promotion.setStartDate(request.startDate());
        promotion.setEndDate(request.endDate());
        promotion.setMaxRedemptions(request.maxRedemptions());
        promotion.setImageUrl(request.imageUrl());

        if (request.categoryIds() != null) {
            Set<Category> categories = new HashSet<>(categoryRepository.findAllById(request.categoryIds()));
            promotion.setCategories(categories);
        }

        if (request.daysOfWeek() != null) {
            promotion.setDaysOfWeek(new HashSet<>(request.daysOfWeek()));
        }

        Promotion saved = promotionRepository.save(promotion);
        return promotionMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "promotions", allEntries = true)
    public void deletePromotion(String userEmail, UUID promotionId) {
        RestaurantProfile restaurant = getRestaurantProfile(userEmail);
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("Promoción", "id", promotionId));

        if (!promotion.getRestaurantProfile().getId().equals(restaurant.getId())) {
            throw new AccessDeniedException("No tienes permisos para eliminar esta promoción");
        }

        promotionRepository.delete(promotion);
    }

    @Override
    @Transactional
    public void toggleFavorite(String userEmail, UUID promotionId) {
        User user = getUserByEmail(userEmail);

        if (!promotionRepository.existsById(promotionId)) {
            throw new ResourceNotFoundException("Promoción", "id", promotionId);
        }

        if (favoriteRepository.existsByUserIdAndPromotionId(user.getId(), promotionId)) {
            favoriteRepository.deleteByUserIdAndPromotionId(user.getId(), promotionId);
        } else {
            Promotion promotion = promotionRepository.getReferenceById(promotionId);
            Favorite favorite = Favorite.builder()
                    .user(user)
                    .promotion(promotion)
                    .build();
            favoriteRepository.save(favorite);
        }
    }

    @Override
    public PageResponse<PromotionResponse> getMyFavorites(String userEmail, Pageable pageable) {
        User user = getUserByEmail(userEmail);
        Page<PromotionResponse> page = favoriteRepository.findByUserId(user.getId(), pageable)
                .map(fav -> promotionMapper.toResponse(fav.getPromotion()));
        return PageResponse.of(page);
    }

    @Override
    public PageResponse<PromotionResponse> getMyPromotions(String userEmail, Pageable pageable) {
        RestaurantProfile restaurant = getRestaurantProfile(userEmail);
        Page<PromotionResponse> page = promotionRepository
                .findByRestaurantProfileId(restaurant.getId(), pageable)
                .map(promotionMapper::toResponse);
        return PageResponse.of(page);
    }

    private RestaurantProfile getRestaurantProfile(String userEmail) {
        User user = getUserByEmail(userEmail);
        return restaurantProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de restaurante", "userId", user.getId()));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email));
    }

    @Override
    @Transactional
    @CacheEvict(value = "promotions", allEntries = true)
    public PromotionResponse updatePromotionStatus(String userEmail, UUID promotionId, PromotionStatus newStatus) {
        RestaurantProfile restaurant = getRestaurantProfile(userEmail);
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("Promoción", "id", promotionId));

        if (!promotion.getRestaurantProfile().getId().equals(restaurant.getId())) {
            throw new AccessDeniedException("No tienes permisos para actualizar el estado de esta promoción");
        }

        promotion.setStatus(newStatus);
        Promotion saved = promotionRepository.save(promotion);
        return promotionMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "promotions", allEntries = true)
    public com.cupon.modules.promotion.dto.RedemptionResponse redeemPromotion(UUID promotionId) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("Promoción", "id", promotionId));

        // Validar que esté activa
        if (promotion.getStatus() != PromotionStatus.ACTIVE) {
            throw new com.cupon.common.exception.PromotionNotRedeemableException(
                    "Esta promoción no está activa y no puede ser canjeada."
            );
        }

        // Validar vigencia de fechas
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        if (now.isBefore(promotion.getStartDate())) {
            throw new com.cupon.common.exception.PromotionNotRedeemableException(
                    "Esta promoción aún no ha comenzado."
            );
        }
        if (now.isAfter(promotion.getEndDate())) {
            throw new com.cupon.common.exception.PromotionNotRedeemableException(
                    "Esta promoción ha expirado."
            );
        }

        // Validar límite de redenciones (0 = ilimitado)
        if (promotion.getMaxRedemptions() > 0
                && promotion.getCurrentRedemptions() >= promotion.getMaxRedemptions()) {
            throw new com.cupon.common.exception.PromotionNotRedeemableException(
                    "Este cupón ya ha sido canjeado el máximo de veces permitidas."
            );
        }

        // Incrementar contador
        promotion.setCurrentRedemptions(promotion.getCurrentRedemptions() + 1);
        promotionRepository.save(promotion);

        int remaining = promotion.getMaxRedemptions() > 0
                ? promotion.getMaxRedemptions() - promotion.getCurrentRedemptions()
                : -1; // -1 = ilimitado

        return new com.cupon.modules.promotion.dto.RedemptionResponse(
                promotion.getId(),
                promotion.getTitle(),
                promotion.getCode(),
                remaining,
                now
        );
    }
}
