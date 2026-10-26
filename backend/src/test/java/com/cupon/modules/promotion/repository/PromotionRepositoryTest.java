package com.cupon.modules.promotion.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cupon.config.AuditingConfig;
import com.cupon.modules.promotion.entity.Category;
import com.cupon.modules.promotion.entity.DiscountType;
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

    private Category sushi;
    private Category postres;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(User.builder()
                .email("resto@cupon.com").password("x").firstName("Resto").lastName("Test")
                .role(Role.ROLE_RESTAURANTE).build());
        RestaurantProfile restaurant = restaurantProfileRepository.save(RestaurantProfile.builder()
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
