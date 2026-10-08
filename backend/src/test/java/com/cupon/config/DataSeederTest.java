package com.cupon.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.cupon.modules.promotion.entity.Category;
import com.cupon.modules.promotion.entity.Promotion;
import com.cupon.modules.promotion.repository.CategoryRepository;
import com.cupon.modules.promotion.repository.PromotionRepository;
import com.cupon.modules.user.entity.ClientProfile;
import com.cupon.modules.user.entity.RestaurantProfile;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.repository.ClientProfileRepository;
import com.cupon.modules.user.repository.RestaurantProfileRepository;
import com.cupon.modules.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class DataSeederTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClientProfileRepository clientProfileRepository;

    @Mock
    private RestaurantProfileRepository restaurantProfileRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private org.springframework.cache.CacheManager cacheManager;

    @InjectMocks
    private DataSeeder dataSeeder;

    @BeforeEach
    void setUp() {
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(restaurantProfileRepository.save(any(RestaurantProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(categoryRepository.findByName(anyString())).thenReturn(Optional.of(Category.builder().name("Test").build()));
    }

    @Test
    @DisplayName("Debe ejecutar la siembra completa cuando la base de datos está vacía")
    void testRunWhenDatabaseIsEmpty() throws Exception {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(promotionRepository.existsByCode(anyString())).thenReturn(false);

        dataSeeder.run();

        verify(userRepository, atLeastOnce()).save(any(User.class));
        verify(clientProfileRepository, atLeastOnce()).save(any(ClientProfile.class));
        verify(restaurantProfileRepository, atLeastOnce()).save(any(RestaurantProfile.class));
        verify(promotionRepository, atLeastOnce()).save(any(Promotion.class));
    }
}
