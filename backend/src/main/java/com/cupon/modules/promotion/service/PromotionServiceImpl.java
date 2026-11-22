package com.cupon.modules.promotion.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.DuplicateResourceException;
import com.cupon.common.exception.PromotionNotRedeemableException;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.promotion.dto.CategoryResponse;
import com.cupon.modules.promotion.dto.CreatePromotionRequest;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.dto.PromotionStatsResponse;
import com.cupon.modules.promotion.dto.RedemptionHistoryResponse;
import com.cupon.modules.promotion.dto.RedemptionResponse;
import com.cupon.modules.promotion.entity.Category;
import com.cupon.modules.promotion.entity.Favorite;
import com.cupon.modules.promotion.entity.Promotion;
import com.cupon.modules.promotion.entity.PromotionStatus;
import com.cupon.modules.promotion.entity.Redemption;
import com.cupon.modules.promotion.mapper.PromotionMapper;
import com.cupon.modules.promotion.repository.CategoryRepository;
import com.cupon.modules.promotion.repository.FavoriteRepository;
import com.cupon.modules.promotion.repository.PromotionRepository;
import com.cupon.modules.promotion.repository.RedemptionRepository;
import com.cupon.modules.user.entity.ApprovalStatus;
import com.cupon.modules.user.entity.RestaurantProfile;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.repository.RestaurantProfileRepository;
import com.cupon.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PromotionServiceImpl implements PromotionService {

    private static final DateTimeFormatter HOUR_FORMAT = DateTimeFormatter.ofPattern("hh:mm a");
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final PromotionRepository promotionRepository;
    private final CategoryRepository categoryRepository;
    private final FavoriteRepository favoriteRepository;
    private final RedemptionRepository redemptionRepository;
    private final RestaurantProfileRepository restaurantProfileRepository;
    private final UserRepository userRepository;
    private final PromotionMapper promotionMapper;

    @Override
    @Cacheable(value = "promotions",
            key = "'active_' + #search + '_' + #dayOfWeek + '_' + #categoryId + '_' + #sort + '_' + #pageable.pageNumber + '_' + #pageable.pageSize + '_' + #pageable.sort")
    public PageResponse<PromotionResponse> getActivePromotions(String search, DayOfWeek dayOfWeek, UUID categoryId,
            String sort, Pageable pageable) {
        String normalizedSearch = (search != null && !search.isBlank()) ? search : null;
        Page<Promotion> page = SORT_POPULAR.equalsIgnoreCase(sort)
                // sort=popular también llega al Pageable como Sort("popular"), que no es un atributo: se descarta
                ? promotionRepository.searchPopular(PromotionStatus.ACTIVE, normalizedSearch, dayOfWeek,
                        categoryId, PageRequest.of(pageable.getPageNumber(), pageable.getPageSize()))
                : promotionRepository.search(PromotionStatus.ACTIVE, normalizedSearch, dayOfWeek,
                        categoryId, pageable);
        return PageResponse.of(page.map(promotionMapper::toResponse));
    }

    @Override
    public List<CategoryResponse> getCategories() {
        return categoryRepository.findAll(Sort.by("name")).stream()
                .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getDescription()))
                .toList();
    }

    @Override
    @Transactional
    public PromotionResponse getPromotionById(UUID id) {
        if (promotionRepository.incrementViewCount(id) == 0) {
            throw new ResourceNotFoundException("Promoción", "id", id);
        }
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promoción", "id", id));
        return promotionMapper.toResponse(promotion);
    }

    @Override
    @Transactional
    @CacheEvict(value = "promotions", allEntries = true)
    public PromotionResponse createPromotion(String userEmail, CreatePromotionRequest request) {
        RestaurantProfile restaurant = getRestaurantProfile(userEmail);
        if (restaurant.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new AccessDeniedException("Tu restaurante aún no está aprobado para publicar cupones.");
        }
        String code = normalizeCode(request.code());
        if (code != null && promotionRepository.existsByCode(code)) {
            throw new DuplicateResourceException("Ya existe un cupón con el código '" + code + "'. Usa uno diferente.");
        }

        Promotion promotion = Promotion.builder()
                .restaurantProfile(restaurant)
                .title(request.title())
                .description(request.description())
                .code(code)
                .discountType(request.discountType())
                .discountValue(request.discountValue())
                .minPurchase(request.minPurchase())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .maxRedemptions(request.maxRedemptions())
                .imageUrl(request.imageUrl())
                .status(PromotionStatus.ACTIVE)
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

        String code = normalizeCode(request.code());
        if (code != null && promotionRepository.existsByCodeAndIdNot(code, promotionId)) {
            throw new DuplicateResourceException("Ya existe un cupón con el código '" + code + "'. Usa uno diferente.");
        }

        promotion.setTitle(request.title());
        promotion.setDescription(request.description());
        promotion.setCode(code);
        promotion.setDiscountType(request.discountType());
        promotion.setDiscountValue(request.discountValue());
        promotion.setMinPurchase(request.minPurchase());
        promotion.setStartDate(request.startDate());
        promotion.setEndDate(request.endDate());
        promotion.setStartTime(request.startTime());
        promotion.setEndTime(request.endTime());
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

    @Override
    public PromotionStatsResponse getMyPromotionStats(String userEmail) {
        RestaurantProfile restaurant = getRestaurantProfile(userEmail);
        long active = 0, paused = 0, expired = 0, totalViews = 0;
        for (PromotionRepository.StatusSummary row : promotionRepository.countByStatusForRestaurant(restaurant.getId())) {
            switch (row.getStatus()) {
                case ACTIVE -> active = row.getCount();
                case DISABLED -> paused = row.getCount();
                case EXPIRED -> expired = row.getCount();
                default -> { }
            }
            totalViews += row.getViews();
        }
        return new PromotionStatsResponse(active, paused, expired, totalViews);
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
    public RedemptionResponse redeemPromotion(UUID promotionId, String userEmail) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("Promoción", "id", promotionId));

        LocalDateTime now = LocalDateTime.now();
        validateRedeemable(promotion, now);

        User customer = (userEmail != null && !userEmail.isBlank())
                ? userRepository.findByEmail(userEmail).orElse(null)
                : null;
        if (customer != null && redemptionRepository.existsByUserIdAndPromotionId(customer.getId(), promotionId)) {
            throw new PromotionNotRedeemableException("Ya canjeaste este cupón anteriormente.");
        }

        // Incremento atómico: si otro canje concurrente tomó el último cupo, aquí devuelve 0
        if (promotionRepository.incrementRedemptionsIfAvailable(promotionId) == 0) {
            throw new PromotionNotRedeemableException(
                    "Este cupón ya ha sido canjeado el máximo de veces permitidas.");
        }

        String verificationCode = generateUniqueVerificationCode();
        Redemption redemption = Redemption.builder()
                .promotion(promotion)
                .user(customer)
                .verificationCode(verificationCode)
                .verified(false)
                .redeemedAt(now)
                .build();
        redemptionRepository.save(redemption);

        int redeemedCount = promotion.getCurrentRedemptions() + 1;
        int remaining = promotion.getMaxRedemptions() > 0
                ? Math.max(0, promotion.getMaxRedemptions() - redeemedCount)
                : -1; // -1 = ilimitado

        return new RedemptionResponse(
                promotion.getId(),
                promotion.getTitle(),
                promotion.getCode(),
                verificationCode,
                remaining,
                now
        );
    }

    @Override
    public PageResponse<RedemptionHistoryResponse> getMyRedemptions(String userEmail, Pageable pageable) {
        User user = getUserByEmail(userEmail);
        Page<RedemptionHistoryResponse> page = redemptionRepository
                .findByUserIdOrderByRedeemedAtDesc(user.getId(), pageable)
                .map(this::toRedemptionHistoryResponse);
        return PageResponse.of(page);
    }

    @Override
    public PageResponse<RedemptionHistoryResponse> getRestaurantRedemptions(String userEmail, Pageable pageable) {
        RestaurantProfile restaurant = getRestaurantProfile(userEmail);
        Page<RedemptionHistoryResponse> page = redemptionRepository
                .findByPromotionRestaurantProfileIdOrderByRedeemedAtDesc(restaurant.getId(), pageable)
                .map(this::toRedemptionHistoryResponse);
        return PageResponse.of(page);
    }

    @Override
    @Transactional
    public RedemptionHistoryResponse verifyRedemption(String userEmail, String verificationCode) {
        RestaurantProfile restaurant = getRestaurantProfile(userEmail);
        String normalized = normalizeCode(verificationCode);
        if (normalized == null) {
            throw new ResourceNotFoundException("Canje", "código de verificación", verificationCode);
        }

        Redemption redemption = redemptionRepository.findByVerificationCode(normalized)
                .orElseThrow(() -> new ResourceNotFoundException("Canje", "código de verificación", normalized));

        if (!redemption.getPromotion().getRestaurantProfile().getId().equals(restaurant.getId())) {
            throw new AccessDeniedException("Este código de verificación no corresponde a tu restaurante.");
        }

        if (redemption.isVerified()) {
            throw new PromotionNotRedeemableException("Este código de verificación ya fue validado anteriormente.");
        }

        redemption.setVerified(true);
        redemption.setVerifiedAt(LocalDateTime.now());
        Redemption saved = redemptionRepository.save(redemption);
        return toRedemptionHistoryResponse(saved);
    }

    private RedemptionHistoryResponse toRedemptionHistoryResponse(Redemption redemption) {
        Promotion promo = redemption.getPromotion();
        return new RedemptionHistoryResponse(
                redemption.getId(),
                promo.getId(),
                promo.getTitle(),
                promo.getRestaurantProfile() != null ? promo.getRestaurantProfile().getBusinessName() : null,
                promo.getCode(),
                redemption.getVerificationCode(),
                promo.getDiscountType(),
                promo.getDiscountValue(),
                redemption.getUser() != null ? redemption.getUser().getEmail() : null,
                redemption.isVerified(),
                redemption.getVerifiedAt(),
                redemption.getRedeemedAt()
        );
    }

    private String generateUniqueVerificationCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder("CUP-");
            for (int i = 0; i < 6; i++) {
                sb.append(CODE_ALPHABET.charAt(SECURE_RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            String candidate = sb.toString();
            if (!redemptionRepository.existsByVerificationCode(candidate)) {
                return candidate;
            }
        }
        return "CUP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    /** Reglas de vigencia para canjear: estado, rango de fechas, día de la semana, franja horaria y cupo. */
    private void validateRedeemable(Promotion promotion, LocalDateTime now) {
        if (promotion.getStatus() != PromotionStatus.ACTIVE) {
            throw new PromotionNotRedeemableException("Esta promoción no está activa y no puede ser canjeada.");
        }
        if (now.isBefore(promotion.getStartDate())) {
            throw new PromotionNotRedeemableException("Esta promoción aún no ha comenzado.");
        }
        if (now.isAfter(promotion.getEndDate())) {
            throw new PromotionNotRedeemableException("Esta promoción ha expirado.");
        }
        if (!promotion.appliesOnDay(now.getDayOfWeek())) {
            throw new PromotionNotRedeemableException("Esta promoción no es válida hoy. Revisa los días en que aplica.");
        }
        if (!promotion.isWithinTimeWindow(now.toLocalTime())) {
            throw new PromotionNotRedeemableException(String.format(
                    "Esta promoción solo es válida entre las %s y las %s.",
                    promotion.getStartTime().format(HOUR_FORMAT), promotion.getEndTime().format(HOUR_FORMAT)));
        }
        if (!promotion.hasRedemptionsLeft()) {
            throw new PromotionNotRedeemableException(
                    "Este cupón ya ha sido canjeado el máximo de veces permitidas.");
        }
    }

    /** Códigos en mayúsculas y sin espacios; vacío se guarda como null para no chocar con la restricción única. */
    private static String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        return code.trim().toUpperCase();
    }
}
