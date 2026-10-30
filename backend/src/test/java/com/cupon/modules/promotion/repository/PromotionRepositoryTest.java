package com.cupon.modules.promotion.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cupon.config.AuditingConfig;
import com.cupon.modules.promotion.entity.Category;
import com.cupon.modules.promotion.entity.DiscountType;
import com.cupon.modules.promotion.entity.Favorite;
import com.cupon.modules.promotion.entity.Promotion;
import com.cupon.modules.promotion.entity.PromotionStatus;
import com.cupon.modules.user.entity.RestaurantProfile;
import com.cupon.modules.user.entity.Role;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.repository.RestaurantProfileRepository;
import com.cupon.modules.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@DataJpaTest
@Import(AuditingConfig.class)
@ActiveProfiles("test")
class PromotionRepositoryTest {

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private RestaurantProfileRepository restaurantProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    private Category sushi;
    private Category postres;
    private RestaurantProfile restaurant;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(User.builder()
                .email("resto@cupon.com").password("x").firstName("Resto").lastName("Test")
                .role(Role.ROLE_RESTAURANTE).build());
        restaurant = restaurantProfileRepository.save(RestaurantProfile.builder()
                .user(user).businessName("Resto Test").build());

        sushi = categoryRepository.save(Category.builder().name("Sushi").build());
        postres = categoryRepository.save(Category.builder().name("Postres").build());

        promotionRepository.save(buildPromotion(restaurant, "Roll 2x1", "SUSHI1", Set.of(sushi)));
        promotionRepository.save(buildPromotion(restaurant, "Combo sushi y postre", "MIX1", Set.of(sushi, postres)));
        promotionRepository.save(buildPromotion(restaurant, "Sin categoría", "NONE1", Set.of()));
    }

    @Test
    void search_porCategoria_devuelveSoloPromocionesDeEsaCategoria() {
        Page<Promotion> result = promotionRepository.search(PromotionStatus.ACTIVE, null, null, postres.getId(),
                PageRequest.of(0, 20));

        assertThat(result.getContent()).extracting(Promotion::getCode).containsExactly("MIX1");
    }

    @Test
    void search_porCategoriaConVariasCategorias_noDuplicaResultados() {
        Page<Promotion> result = promotionRepository.search(PromotionStatus.ACTIVE, null, null, sushi.getId(),
                PageRequest.of(0, 20));

        assertThat(result.getContent()).extracting(Promotion::getCode).containsExactlyInAnyOrder("SUSHI1", "MIX1");
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    void search_sinCategoria_devuelveTodas() {
        Page<Promotion> result = promotionRepository.search(PromotionStatus.ACTIVE, null, null, null,
                PageRequest.of(0, 20));

        assertThat(result.getTotalElements()).isEqualTo(3);
    }

    @Test
    void search_categoriaInexistente_devuelveVacio() {
        Page<Promotion> result = promotionRepository.search(PromotionStatus.ACTIVE, null, null, UUID.randomUUID(),
                PageRequest.of(0, 20));

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void incrementViewCount_existente_sumaUnaVistaPorLlamada() {
        Promotion promotion = promotionRepository.findByCode("SUSHI1").orElseThrow();

        assertThat(promotionRepository.incrementViewCount(promotion.getId())).isEqualTo(1);
        promotionRepository.incrementViewCount(promotion.getId());

        assertThat(promotionRepository.findById(promotion.getId()).orElseThrow().getViewCount()).isEqualTo(2);
    }

    @Test
    void incrementViewCount_inexistente_noActualizaNada() {
        assertThat(promotionRepository.incrementViewCount(UUID.randomUUID())).isZero();
    }

    @Test
    void searchPopular_ordenaPorCanjesFavoritosYVistasPonderados() {
        // SUSHI1: 2 canjes -> 6 | MIX1: 2 favoritos + 1 vista -> 5 | NONE1: 4 vistas -> 4
        Promotion sushi1 = promotionRepository.findByCode("SUSHI1").orElseThrow();
        sushi1.setCurrentRedemptions(2);
        Promotion mix1 = promotionRepository.findByCode("MIX1").orElseThrow();
        mix1.setViewCount(1);
        Promotion none1 = promotionRepository.findByCode("NONE1").orElseThrow();
        none1.setViewCount(4);
        promotionRepository.saveAll(List.of(sushi1, mix1, none1));
        favoriteRepository.save(Favorite.builder().user(saveClient("a@cupon.com")).promotion(mix1).build());
        favoriteRepository.save(Favorite.builder().user(saveClient("b@cupon.com")).promotion(mix1).build());

        Page<Promotion> result = promotionRepository.searchPopular(PromotionStatus.ACTIVE, null, null, null,
                PageRequest.of(0, 20));

        assertThat(result.getContent()).extracting(Promotion::getCode).containsExactly("SUSHI1", "MIX1", "NONE1");
        assertThat(result.getTotalElements()).isEqualTo(3);
    }

    @Test
    void searchPopular_aplicaFiltrosYPaginaSobreElTotalFiltrado() {
        Promotion mix1 = promotionRepository.findByCode("MIX1").orElseThrow();
        mix1.setViewCount(10);
        promotionRepository.save(mix1);
        Promotion draft = buildPromotion(restaurant, "Sushi borrador", "DRAFT1", Set.of(sushi));
        draft.setStatus(PromotionStatus.DRAFT);
        draft.setViewCount(100);
        promotionRepository.save(draft);

        Page<Promotion> result = promotionRepository.searchPopular(PromotionStatus.ACTIVE, null, null, sushi.getId(),
                PageRequest.of(0, 1));

        assertThat(result.getContent()).extracting(Promotion::getCode).containsExactly("MIX1");
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    private User saveClient(String email) {
        return userRepository.save(User.builder()
                .email(email).password("x").firstName("Cliente").lastName("Test")
                .role(Role.ROLE_CLIENTE).build());
    }

    private Promotion buildPromotion(RestaurantProfile restaurant, String title, String code, Set<Category> categories) {
        return Promotion.builder()
                .restaurantProfile(restaurant)
                .title(title)
                .code(code)
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.TEN)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .status(PromotionStatus.ACTIVE)
                .categories(new HashSet<>(categories))
                .build();
    }
}
