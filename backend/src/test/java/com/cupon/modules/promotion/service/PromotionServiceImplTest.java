package com.cupon.modules.promotion.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.DuplicateResourceException;
import com.cupon.common.exception.PromotionNotRedeemableException;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.promotion.dto.CategoryResponse;
import com.cupon.modules.promotion.dto.CreatePromotionRequest;
import com.cupon.modules.promotion.dto.PricingOptimizationRequest;
import com.cupon.modules.promotion.dto.PricingOptimizationResponse;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.dto.PromotionStatsResponse;
import com.cupon.modules.promotion.entity.Category;
import com.cupon.modules.promotion.entity.DiscountType;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PromotionServiceImplTest {

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private RedemptionRepository redemptionRepository;

    @Mock
    private RestaurantProfileRepository restaurantProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PromotionMapper promotionMapper;

    @InjectMocks
    private PromotionServiceImpl promotionService;

    private final String userEmail = "resto@cupon.com";

    private User buildUser() {
        User user = User.builder().email(userEmail).build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private RestaurantProfile buildRestaurantProfile(User user) {
        RestaurantProfile restaurant = RestaurantProfile.builder()
                .user(user)
                .businessName("Pizza Feliz")
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
        restaurant.setId(UUID.randomUUID());
        return restaurant;
    }

    private Promotion buildPromotion(RestaurantProfile restaurant) {
        Promotion promotion = Promotion.builder()
                .restaurantProfile(restaurant)
                .title("2x1 en pizzas")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.TEN)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(5))
                .status(PromotionStatus.ACTIVE)
                .build();
        promotion.setId(UUID.randomUUID());
        return promotion;
    }

    private CreatePromotionRequest buildRequest() {
        return new CreatePromotionRequest(
                "2x1 en pizzas", "descripcion", "CODE1", DiscountType.PERCENTAGE,
                BigDecimal.TEN, BigDecimal.ZERO, LocalDateTime.now(),
                LocalDateTime.now().plusDays(5), 100, null, Set.of(), Set.of(), null, null);
    }

    @Test
    void getActivePromotions_sinFiltros_buscaSoloPorStatus() {
        Pageable pageable = PageRequest.of(0, 20);
        Promotion promotion = buildPromotion(buildRestaurantProfile(buildUser()));
        Page<Promotion> page = new PageImpl<>(List.of(promotion), pageable, 1);

        when(promotionRepository.search(eq(PromotionStatus.ACTIVE), eq(null), eq(null), eq(null), eq(pageable)))
                .thenReturn(page);
        when(promotionMapper.toResponse(any(Promotion.class))).thenReturn(mock(promotion));

        PageResponse<PromotionResponse> result = promotionService.getActivePromotions(null, null, null, null, pageable);

        assertThat(result.content()).hasSize(1);
        verify(promotionRepository).search(PromotionStatus.ACTIVE, null, null, null, pageable);
    }

    @Test
    void getActivePromotions_soloTexto_pasaSearchYDejaDiaEnNull() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Promotion> page = new PageImpl<>(List.of());

        when(promotionRepository.search(eq(PromotionStatus.ACTIVE), eq("pizza"), eq(null), eq(null), eq(pageable)))
                .thenReturn(page);

        promotionService.getActivePromotions("pizza", null, null, null, pageable);

        verify(promotionRepository).search(PromotionStatus.ACTIVE, "pizza", null, null, pageable);
    }

    @Test
    void getActivePromotions_soloDia_pasaDiaYDejaSearchEnNull() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Promotion> page = new PageImpl<>(List.of());

        when(promotionRepository.search(eq(PromotionStatus.ACTIVE), eq(null), eq(DayOfWeek.MONDAY), eq(null), eq(pageable)))
                .thenReturn(page);

        promotionService.getActivePromotions(null, DayOfWeek.MONDAY, null, null, pageable);

        verify(promotionRepository).search(PromotionStatus.ACTIVE, null, DayOfWeek.MONDAY, null, pageable);
    }

    @Test
    void getActivePromotions_textoEnBlanco_seNormalizaANull() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Promotion> page = new PageImpl<>(List.of());

        when(promotionRepository.search(eq(PromotionStatus.ACTIVE), eq(null), eq(DayOfWeek.SUNDAY), eq(null), eq(pageable)))
                .thenReturn(page);

        promotionService.getActivePromotions("   ", DayOfWeek.SUNDAY, null, null, pageable);

        verify(promotionRepository).search(PromotionStatus.ACTIVE, null, DayOfWeek.SUNDAY, null, pageable);
    }

    @Test
    void getActivePromotions_textoYDia_combinaAmbosFiltros() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Promotion> page = new PageImpl<>(List.of());

        when(promotionRepository.search(eq(PromotionStatus.ACTIVE), eq("pizza"), eq(DayOfWeek.FRIDAY), eq(null), eq(pageable)))
                .thenReturn(page);

        promotionService.getActivePromotions("pizza", DayOfWeek.FRIDAY, null, null, pageable);

        verify(promotionRepository).search(PromotionStatus.ACTIVE, "pizza", DayOfWeek.FRIDAY, null, pageable);
    }

    @Test
    void getActivePromotions_diaSinResultados_devuelvePageResponseVacio() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Promotion> page = new PageImpl<>(List.of(), pageable, 0);

        when(promotionRepository.search(eq(PromotionStatus.ACTIVE), eq(null), eq(DayOfWeek.SATURDAY), eq(null), eq(pageable)))
                .thenReturn(page);

        PageResponse<PromotionResponse> result = promotionService.getActivePromotions(null, DayOfWeek.SATURDAY, null, null,
                pageable);

        assertThat(result.content()).isEmpty();
        assertThat(result.totalElements()).isZero();
    }

    @Test
    void getActivePromotions_soloCategoria_pasaCategoryIdAlRepositorio() {
        Pageable pageable = PageRequest.of(0, 20);
        UUID categoryId = UUID.randomUUID();
        Page<Promotion> page = new PageImpl<>(List.of(), pageable, 0);

        when(promotionRepository.search(eq(PromotionStatus.ACTIVE), eq(null), eq(null), eq(categoryId), eq(pageable)))
                .thenReturn(page);

        promotionService.getActivePromotions(null, null, categoryId, null, pageable);

        verify(promotionRepository).search(PromotionStatus.ACTIVE, null, null, categoryId, pageable);
    }

    @Test
    void getActivePromotions_sortPopular_usaSearchPopularSinSortDelPageable() {
        // sort=popular también lo interpreta Spring como Sort("popular") dentro del Pageable
        Pageable pageable = PageRequest.of(1, 10, Sort.by("popular"));
        Pageable unsorted = PageRequest.of(1, 10);
        when(promotionRepository.searchPopular(PromotionStatus.ACTIVE, "pizza", null, null, unsorted))
                .thenReturn(new PageImpl<>(List.of(), unsorted, 0));

        promotionService.getActivePromotions("pizza", null, null, "POPULAR", pageable);

        verify(promotionRepository).searchPopular(PromotionStatus.ACTIVE, "pizza", null, null, unsorted);
        verify(promotionRepository, never()).search(any(), any(), any(), any(), any());
    }

    @Test
    void getActivePromotions_otroSort_respetaElPageable() {
        Pageable pageable = PageRequest.of(0, 20, Sort.by("title"));
        when(promotionRepository.search(PromotionStatus.ACTIVE, null, null, null, pageable))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        promotionService.getActivePromotions(null, null, null, "title", pageable);

        verify(promotionRepository).search(PromotionStatus.ACTIVE, null, null, null, pageable);
        verify(promotionRepository, never()).searchPopular(any(), any(), any(), any(), any());
    }

    @Test
    void getCategories_devuelveCategoriasOrdenadasPorNombre() {
        Category sushi = Category.builder().name("Sushi").description("Rolls").build();
        sushi.setId(UUID.randomUUID());
        when(categoryRepository.findAll(Sort.by("name"))).thenReturn(List.of(sushi));

        List<CategoryResponse> result = promotionService.getCategories();

        assertThat(result).containsExactly(new CategoryResponse(sushi.getId(), "Sushi", "Rolls"));
    }

    @Test
    void getPromotionById_existente_devuelveResponse() {
        Promotion promotion = buildPromotion(buildRestaurantProfile(buildUser()));
        when(promotionRepository.incrementViewCount(promotion.getId())).thenReturn(1);
        when(promotionRepository.findById(promotion.getId())).thenReturn(Optional.of(promotion));
        when(promotionMapper.toResponse(promotion)).thenReturn(mock(promotion));

        PromotionResponse response = promotionService.getPromotionById(promotion.getId());

        assertThat(response.id()).isEqualTo(promotion.getId());
    }

    @Test
    void getPromotionById_existente_incrementaViewCountAntesDeLeer() {
        Promotion promotion = buildPromotion(buildRestaurantProfile(buildUser()));
        promotion.setViewCount(5);
        when(promotionRepository.incrementViewCount(promotion.getId())).thenReturn(1);
        when(promotionRepository.findById(promotion.getId())).thenReturn(Optional.of(promotion));
        when(promotionMapper.toResponse(promotion)).thenReturn(mock(promotion));

        PromotionResponse response = promotionService.getPromotionById(promotion.getId());

        verify(promotionRepository).incrementViewCount(promotion.getId());
        assertThat(response.viewCount()).isEqualTo(5);
    }

    @Test
    void getPromotionById_inexistente_lanzaResourceNotFoundException() {
        UUID id = UUID.randomUUID();
        when(promotionRepository.incrementViewCount(id)).thenReturn(0);

        assertThatThrownBy(() -> promotionService.getPromotionById(id))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(promotionRepository, never()).findById(id);
    }

    @Test
    void createPromotion_conPerfilValido_creaYDevuelveResponse() {
        User user = buildUser();
        RestaurantProfile restaurant = buildRestaurantProfile(user);
        CreatePromotionRequest request = buildRequest();

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(restaurantProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(restaurant));
        when(promotionRepository.save(any(Promotion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(promotionMapper.toResponse(any(Promotion.class))).thenReturn(mock(buildPromotion(restaurant)));

        promotionService.createPromotion(userEmail, request);

        ArgumentCaptor<Promotion> captor = ArgumentCaptor.forClass(Promotion.class);
        verify(promotionRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(PromotionStatus.ACTIVE);
    }

    @Test
    void createPromotion_sinPerfilDeRestaurante_lanzaResourceNotFoundException() {
        User user = buildUser();
        CreatePromotionRequest request = buildRequest();

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(restaurantProfileRepository.findByUserId(user.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> promotionService.createPromotion(userEmail, request))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(promotionRepository, never()).save(any());
    }

    @Test
    void updatePromotion_deOtroRestaurante_lanzaAccessDeniedException() {
        User owner = buildUser();
        RestaurantProfile ownerProfile = buildRestaurantProfile(owner);
        Promotion promotion = buildPromotion(ownerProfile);

        User otherUser = User.builder().email("otro@cupon.com").build();
        otherUser.setId(UUID.randomUUID());
        RestaurantProfile otherProfile = buildRestaurantProfile(otherUser);

        when(userRepository.findByEmail("otro@cupon.com")).thenReturn(Optional.of(otherUser));
        when(restaurantProfileRepository.findByUserId(otherUser.getId())).thenReturn(Optional.of(otherProfile));
        when(promotionRepository.findById(promotion.getId())).thenReturn(Optional.of(promotion));

        assertThatThrownBy(() -> promotionService.updatePromotion("otro@cupon.com", promotion.getId(), buildRequest()))
                .isInstanceOf(AccessDeniedException.class);

        verify(promotionRepository, never()).save(any());
    }

    @Test
    void deletePromotion_delPropietario_eliminaLaPromocion() {
        User user = buildUser();
        RestaurantProfile restaurant = buildRestaurantProfile(user);
        Promotion promotion = buildPromotion(restaurant);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(restaurantProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(restaurant));
        when(promotionRepository.findById(promotion.getId())).thenReturn(Optional.of(promotion));

        promotionService.deletePromotion(userEmail, promotion.getId());

        verify(promotionRepository).delete(promotion);
    }

    @Test
    void toggleFavorite_promocionInexistente_lanzaResourceNotFoundException() {
        User user = buildUser();
        UUID promotionId = UUID.randomUUID();

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(promotionRepository.existsById(promotionId)).thenReturn(false);

        assertThatThrownBy(() -> promotionService.toggleFavorite(userEmail, promotionId))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(favoriteRepository, never()).save(any());
    }

    @Test
    void toggleFavorite_sinFavoritoPrevio_loAgrega() {
        User user = buildUser();
        RestaurantProfile restaurant = buildRestaurantProfile(user);
        Promotion promotion = buildPromotion(restaurant);

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(promotionRepository.existsById(promotion.getId())).thenReturn(true);
        when(favoriteRepository.existsByUserIdAndPromotionId(user.getId(), promotion.getId())).thenReturn(false);
        when(promotionRepository.getReferenceById(promotion.getId())).thenReturn(promotion);

        promotionService.toggleFavorite(userEmail, promotion.getId());

        verify(favoriteRepository).save(any());
        verify(favoriteRepository, never()).deleteByUserIdAndPromotionId(any(), any());
    }

    @Test
    void toggleFavorite_conFavoritoPrevio_loElimina() {
        User user = buildUser();
        UUID promotionId = UUID.randomUUID();

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(promotionRepository.existsById(promotionId)).thenReturn(true);
        when(favoriteRepository.existsByUserIdAndPromotionId(user.getId(), promotionId)).thenReturn(true);

        promotionService.toggleFavorite(userEmail, promotionId);

        verify(favoriteRepository).deleteByUserIdAndPromotionId(user.getId(), promotionId);
        verify(favoriteRepository, never()).save(any());
    }

    private PromotionResponse mock(Promotion promotion) {
        return new PromotionResponse(
                promotion.getId(), promotion.getTitle(), promotion.getDescription(), promotion.getCode(),
                promotion.getDiscountType(), promotion.getDiscountValue(), promotion.getMinPurchase(),
                promotion.getStartDate(), promotion.getEndDate(), promotion.getMaxRedemptions(),
                promotion.getCurrentRedemptions(), promotion.getStatus(), promotion.getImageUrl(),
                promotion.getRestaurantProfile().getBusinessName(), promotion.getRestaurantProfile().getId(),
                Set.of(), promotion.getCreatedAt(), Set.of(), promotion.getStartTime(), promotion.getEndTime(),
                promotion.isCurrentlyActive(), promotion.getViewCount());
    }

    @Test
    void updatePromotionStatus_whenOwner_shouldUpdateStatusSuccessfully() {
        User user = buildUser();
        RestaurantProfile restaurant = buildRestaurantProfile(user);
        Promotion promotion = buildPromotion(restaurant);
        promotion.setStatus(PromotionStatus.DRAFT);
        UUID promotionId = promotion.getId();

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(restaurantProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(restaurant));
        when(promotionRepository.findById(promotionId)).thenReturn(Optional.of(promotion));
        when(promotionRepository.save(any(Promotion.class))).thenAnswer(i -> i.getArgument(0));
        when(promotionMapper.toResponse(any(Promotion.class))).thenReturn(mock(promotion));

        PromotionResponse response = promotionService.updatePromotionStatus(userEmail, promotionId,
                PromotionStatus.ACTIVE);

        assertThat(response).isNotNull();
        assertThat(promotion.getStatus()).isEqualTo(PromotionStatus.ACTIVE);
        verify(promotionRepository).save(promotion);
    }

    @Test
    void updatePromotionStatus_whenNotOwner_shouldThrowAccessDeniedException() {
        User user = buildUser();
        RestaurantProfile myRestaurant = buildRestaurantProfile(user);
        myRestaurant.setId(UUID.randomUUID());

        RestaurantProfile otherRestaurant = buildRestaurantProfile(user);
        otherRestaurant.setId(UUID.randomUUID());

        Promotion promotion = buildPromotion(otherRestaurant);
        UUID promotionId = promotion.getId();

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(restaurantProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(myRestaurant));
        when(promotionRepository.findById(promotionId)).thenReturn(Optional.of(promotion));

        assertThatThrownBy(
                () -> promotionService.updatePromotionStatus(userEmail, promotionId, PromotionStatus.DISABLED))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("No tienes permisos");
    }

    @Test
    void updatePromotionStatus_whenNotFound_shouldThrowResourceNotFoundException() {
        User user = buildUser();
        RestaurantProfile restaurant = buildRestaurantProfile(user);
        UUID nonExistentId = UUID.randomUUID();

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(restaurantProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(restaurant));
        when(promotionRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> promotionService.updatePromotionStatus(userEmail, nonExistentId, PromotionStatus.ACTIVE))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getMyPromotionStats_mapeaEstadosYSumaVistas() {
        User user = buildUser();
        RestaurantProfile restaurant = buildRestaurantProfile(user);
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(restaurantProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(restaurant));
        when(promotionRepository.countByStatusForRestaurant(restaurant.getId())).thenReturn(List.of(
                statusSummary(PromotionStatus.ACTIVE, 4, 30),
                statusSummary(PromotionStatus.DISABLED, 2, 7),
                statusSummary(PromotionStatus.EXPIRED, 1, 3),
                statusSummary(PromotionStatus.DRAFT, 5, 0)));

        PromotionStatsResponse stats = promotionService.getMyPromotionStats(userEmail);

        assertThat(stats).isEqualTo(new PromotionStatsResponse(4, 2, 1, 40));
    }

    @Test
    void getMyPromotionStats_sinPromociones_devuelveCeros() {
        User user = buildUser();
        RestaurantProfile restaurant = buildRestaurantProfile(user);
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(restaurantProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(restaurant));
        when(promotionRepository.countByStatusForRestaurant(restaurant.getId())).thenReturn(List.of());

        assertThat(promotionService.getMyPromotionStats(userEmail))
                .isEqualTo(new PromotionStatsResponse(0, 0, 0, 0));
    }

    private PromotionRepository.StatusSummary statusSummary(PromotionStatus status, long count, long views) {
        return new PromotionRepository.StatusSummary() {
            public PromotionStatus getStatus() { return status; }
            public long getCount() { return count; }
            public long getViews() { return views; }
        };
    }

    // ── Código de cupón ──────────────────────────────────────────────────────

    @Test
    void createPromotion_codigoRepetido_lanzaDuplicateResourceException() {
        User user = buildUser();
        RestaurantProfile restaurant = buildRestaurantProfile(user);
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(restaurantProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(restaurant));
        when(promotionRepository.existsByCode("CODE1")).thenReturn(true);

        assertThatThrownBy(() -> promotionService.createPromotion(userEmail, buildRequest()))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("CODE1");
        verify(promotionRepository, never()).save(any());
    }

    @Test
    void createPromotion_normalizaCodigoAMayusculasSinEspacios() {
        User user = buildUser();
        RestaurantProfile restaurant = buildRestaurantProfile(user);
        CreatePromotionRequest request = new CreatePromotionRequest(
                "2x1", null, "  burger2x1 ", DiscountType.PERCENTAGE, BigDecimal.TEN, BigDecimal.ZERO,
                LocalDateTime.now(), LocalDateTime.now().plusDays(5), 100, null, Set.of(), Set.of(), null, null);
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(restaurantProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(restaurant));
        when(promotionRepository.save(any(Promotion.class))).thenAnswer(inv -> inv.getArgument(0));

        promotionService.createPromotion(userEmail, request);

        ArgumentCaptor<Promotion> captor = ArgumentCaptor.forClass(Promotion.class);
        verify(promotionRepository).save(captor.capture());
        assertThat(captor.getValue().getCode()).isEqualTo("BURGER2X1");
    }

    @Test
    void updatePromotion_codigoDeOtraPromocion_lanzaDuplicateResourceException() {
        User user = buildUser();
        RestaurantProfile restaurant = buildRestaurantProfile(user);
        Promotion promotion = buildPromotion(restaurant);
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(restaurantProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(restaurant));
        when(promotionRepository.findById(promotion.getId())).thenReturn(Optional.of(promotion));
        when(promotionRepository.existsByCodeAndIdNot("CODE1", promotion.getId())).thenReturn(true);

        assertThatThrownBy(() -> promotionService.updatePromotion(userEmail, promotion.getId(), buildRequest()))
                .isInstanceOf(DuplicateResourceException.class);
        verify(promotionRepository, never()).save(any());
    }

    // ── Canje ────────────────────────────────────────────────────────────────

    private Promotion buildRedeemablePromotion() {
        Promotion promotion = buildPromotion(buildRestaurantProfile(buildUser()));
        promotion.setStartDate(LocalDateTime.now().minusDays(1));
        promotion.setMaxRedemptions(10);
        promotion.setCurrentRedemptions(3);
        when(promotionRepository.findById(promotion.getId())).thenReturn(Optional.of(promotion));
        return promotion;
    }

    @Test
    void redeemPromotion_valida_incrementaDeFormaAtomicaYDevuelveRestantes() {
        Promotion promotion = buildRedeemablePromotion();
        when(promotionRepository.incrementRedemptionsIfAvailable(promotion.getId())).thenReturn(1);
        when(redemptionRepository.save(any(Redemption.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = promotionService.redeemPromotion(promotion.getId());

        assertThat(response.remainingRedemptions()).isEqualTo(6);
        assertThat(response.verificationCode()).startsWith("CUP-");
        verify(promotionRepository).incrementRedemptionsIfAvailable(promotion.getId());
        verify(redemptionRepository).save(any(Redemption.class));
        verify(promotionRepository, never()).save(any());
    }

    @Test
    void createPromotion_restaurantePendiente_lanzaAccessDeniedException() {
        User user = buildUser();
        RestaurantProfile pending = buildRestaurantProfile(user);
        pending.setApprovalStatus(ApprovalStatus.PENDING);
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(restaurantProfileRepository.findByUserId(user.getId())).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> promotionService.createPromotion(userEmail, buildRequest()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("aprobado");
        verify(promotionRepository, never()).save(any());
    }

    @Test
    void redeemPromotion_clienteYaCanjeo_lanzaPromotionNotRedeemable() {
        Promotion promotion = buildRedeemablePromotion();
        User customer = buildUser();
        when(userRepository.findByEmail("cliente@cupon.com")).thenReturn(Optional.of(customer));
        when(redemptionRepository.existsByUserIdAndPromotionId(customer.getId(), promotion.getId())).thenReturn(true);

        assertThatThrownBy(() -> promotionService.redeemPromotion(promotion.getId(), "cliente@cupon.com"))
                .isInstanceOf(PromotionNotRedeemableException.class)
                .hasMessageContaining("Ya canjeaste");
        verify(promotionRepository, never()).incrementRedemptionsIfAvailable(any());
    }

    @Test
    void verifyRedemption_codigoValido_marcaComoVerificado() {
        User owner = buildUser();
        RestaurantProfile restaurant = buildRestaurantProfile(owner);
        Promotion promotion = buildPromotion(restaurant);
        Redemption redemption = Redemption.builder()
                .promotion(promotion)
                .verificationCode("CUP-ABC123")
                .verified(false)
                .redeemedAt(LocalDateTime.now())
                .build();
        redemption.setId(UUID.randomUUID());

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(owner));
        when(restaurantProfileRepository.findByUserId(owner.getId())).thenReturn(Optional.of(restaurant));
        when(redemptionRepository.findByVerificationCode("CUP-ABC123")).thenReturn(Optional.of(redemption));
        when(redemptionRepository.save(any(Redemption.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = promotionService.verifyRedemption(userEmail, " cup-abc123 ");

        assertThat(result.verified()).isTrue();
        assertThat(result.verifiedAt()).isNotNull();
        assertThat(result.verificationCode()).isEqualTo("CUP-ABC123");
    }

    @Test
    void verifyRedemption_codigoYaVerificado_lanzaPromotionNotRedeemable() {
        User owner = buildUser();
        RestaurantProfile restaurant = buildRestaurantProfile(owner);
        Promotion promotion = buildPromotion(restaurant);
        Redemption redemption = Redemption.builder()
                .promotion(promotion)
                .verificationCode("CUP-ABC123")
                .verified(true)
                .verifiedAt(LocalDateTime.now().minusMinutes(5))
                .redeemedAt(LocalDateTime.now().minusMinutes(10))
                .build();

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(owner));
        when(restaurantProfileRepository.findByUserId(owner.getId())).thenReturn(Optional.of(restaurant));
        when(redemptionRepository.findByVerificationCode("CUP-ABC123")).thenReturn(Optional.of(redemption));

        assertThatThrownBy(() -> promotionService.verifyRedemption(userEmail, "CUP-ABC123"))
                .isInstanceOf(PromotionNotRedeemableException.class)
                .hasMessageContaining("validado anteriormente");
    }

    @Test
    void verifyRedemption_deOtroRestaurante_lanzaAccessDeniedException() {
        User owner = buildUser();
        RestaurantProfile myRestaurant = buildRestaurantProfile(owner);
        RestaurantProfile otherRestaurant = buildRestaurantProfile(owner);
        Promotion otherPromo = buildPromotion(otherRestaurant);
        Redemption redemption = Redemption.builder()
                .promotion(otherPromo)
                .verificationCode("CUP-XYZ999")
                .verified(false)
                .redeemedAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(owner));
        when(restaurantProfileRepository.findByUserId(owner.getId())).thenReturn(Optional.of(myRestaurant));
        when(redemptionRepository.findByVerificationCode("CUP-XYZ999")).thenReturn(Optional.of(redemption));

        assertThatThrownBy(() -> promotionService.verifyRedemption(userEmail, "CUP-XYZ999"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void redeemPromotion_ultimoCupoTomadoPorOtroCanje_lanzaPromotionNotRedeemable() {
        Promotion promotion = buildRedeemablePromotion();
        when(promotionRepository.incrementRedemptionsIfAvailable(promotion.getId())).thenReturn(0);

        assertThatThrownBy(() -> promotionService.redeemPromotion(promotion.getId()))
                .isInstanceOf(PromotionNotRedeemableException.class)
                .hasMessageContaining("máximo");
    }

    @Test
    void redeemPromotion_diaNoPermitido_lanzaPromotionNotRedeemable() {
        Promotion promotion = buildRedeemablePromotion();
        DayOfWeek otherDay = LocalDateTime.now().getDayOfWeek().plus(1);
        promotion.setDaysOfWeek(new java.util.HashSet<>(Set.of(otherDay)));

        assertThatThrownBy(() -> promotionService.redeemPromotion(promotion.getId()))
                .isInstanceOf(PromotionNotRedeemableException.class)
                .hasMessageContaining("no es válida hoy");
        verify(promotionRepository, never()).incrementRedemptionsIfAvailable(any());
    }

    @Test
    void redeemPromotion_fueraDeFranjaHoraria_lanzaPromotionNotRedeemable() {
        Promotion promotion = buildRedeemablePromotion();
        LocalTime now = LocalTime.now();
        // Franja de 1 minuto que ya pasó (o, cerca de medianoche, que aún no empieza)
        LocalTime start = now.isAfter(LocalTime.of(0, 10)) ? LocalTime.of(0, 0) : LocalTime.of(23, 0);
        promotion.setStartTime(start);
        promotion.setEndTime(start.plusMinutes(1));

        assertThatThrownBy(() -> promotionService.redeemPromotion(promotion.getId()))
                .isInstanceOf(PromotionNotRedeemableException.class)
                .hasMessageContaining("solo es válida entre");
        verify(promotionRepository, never()).incrementRedemptionsIfAvailable(any());
    }

    @Test
    void redeemPromotion_inactiva_lanzaPromotionNotRedeemable() {
        Promotion promotion = buildRedeemablePromotion();
        promotion.setStatus(PromotionStatus.DISABLED);

        assertThatThrownBy(() -> promotionService.redeemPromotion(promotion.getId()))
                .isInstanceOf(PromotionNotRedeemableException.class);
        verify(promotionRepository, never()).incrementRedemptionsIfAvailable(any());
    }

    @Test
    void optimizeDynamicPricing_casoBaseDocumento_resuelveSimplexExacto() {
        PricingOptimizationRequest req = new PricingOptimizationRequest(
                40_000.0,
                20_000.0,
                0.10,
                0.25,
                120.0,
                70.0,
                680_000.0
        );

        PricingOptimizationResponse res = promotionService.optimizeDynamicPricing(req);

        assertThat(res.xOpt()).isEqualTo(70.0);
        assertThat(res.yOpt()).isEqualTo(40.0);
        assertThat(res.totalCoupons()).isEqualTo(110.0);
        assertThat(res.maxProfit()).isEqualTo(1_520_000.0);
        assertThat(res.u1()).isEqualTo(16_000.0);
        assertThat(res.u2()).isEqualTo(10_000.0);
        assertThat(res.d1()).isEqualTo(4_000.0);
        assertThat(res.d2()).isEqualTo(10_000.0);
        assertThat(res.s1UnusedCapacity()).isEqualTo(10.0);
        assertThat(res.s2UnmetDemandStage1()).isEqualTo(0.0);
        assertThat(res.s3RemainingBudget()).isEqualTo(0.0);
        assertThat(res.vertices()).hasSizeGreaterThanOrEqualTo(4);
    }

    @Test
    void optimizeDynamicPricing_descuentoNoRentable_lanzaIllegalArgumentException() {
        PricingOptimizationRequest req = new PricingOptimizationRequest(
                40_000.0,
                30_000.0,
                0.10,
                0.30,
                100.0,
                50.0,
                500_000.0
        );

        assertThatThrownBy(() -> promotionService.optimizeDynamicPricing(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("pérdida o utilidad nula");
    }

    @Test
    void redeemPromotion_alcanzaMetaEtapa1_pasaAutomaticamenteAEtapa2() {
        Promotion promotion = buildRedeemablePromotion();
        promotion.setDynamicPricingEnabled(true);
        promotion.setStage1MaxRedemptions(70);
        promotion.setStage1DiscountValue(BigDecimal.valueOf(10));
        promotion.setStage2DiscountValue(BigDecimal.valueOf(25));
        promotion.setDiscountValue(BigDecimal.valueOf(10));
        promotion.setMaxRedemptions(110);
        promotion.setCurrentRedemptions(69); // El próximo canje es el #70 (x* = 70)

        when(promotionRepository.findById(promotion.getId())).thenReturn(Optional.of(promotion));
        when(promotionRepository.incrementRedemptionsIfAvailable(promotion.getId())).thenReturn(1);

        promotionService.redeemPromotion(promotion.getId());

        assertThat(promotion.getDiscountValue()).isEqualByComparingTo(BigDecimal.valueOf(25));
        assertThat(promotion.getCurrentDynamicStage()).isEqualTo(2);
        verify(promotionRepository).save(promotion);
    }
}
