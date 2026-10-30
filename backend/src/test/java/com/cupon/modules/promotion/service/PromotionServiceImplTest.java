package com.cupon.modules.promotion.service;

import com.cupon.common.dto.PageResponse;
import com.cupon.common.exception.ResourceNotFoundException;
import com.cupon.modules.promotion.dto.CategoryResponse;
import com.cupon.modules.promotion.dto.CreatePromotionRequest;
import com.cupon.modules.promotion.dto.PromotionResponse;
import com.cupon.modules.promotion.entity.Category;
import com.cupon.modules.promotion.entity.DiscountType;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
        RestaurantProfile restaurant = RestaurantProfile.builder().user(user).businessName("Pizza Feliz").build();
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

        verify(promotionRepository).save(any(Promotion.class));
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
}
