package com.cupon.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.cupon.modules.promotion.repository.CategoryRepository;
import com.cupon.modules.promotion.repository.PromotionRepository;
import com.cupon.modules.user.repository.ClientProfileRepository;
import com.cupon.modules.user.repository.RestaurantProfileRepository;
import com.cupon.modules.user.repository.UserRepository;
import com.cupon.modules.user.entity.User;

import com.cupon.modules.user.entity.Role;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.entity.RestaurantProfile;
import com.cupon.modules.user.entity.ClientProfile;
import com.cupon.modules.user.entity.ApprovalStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Profile("!test") // esto para que corra solo en desarrollo local, no en pruebas automaticas
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final RestaurantProfileRepository restaurantProfileRepository;
    private final CategoryRepository categoryRepository;
    private final PromotionRepository promotionRepository;
    private final PasswordEncoder passwordEncoder;

    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            log.info("DataSeeder: La base de datos ya contiene datos, no se ejecutara el seed.");
            return;
        }

        log.info("DataSeeder: Inicializando la base de datos...");

        seedAdmin();

    }

    private void seedAdmin() {
        User admin = User.builder()
                .email("admin@cupon.com")
                .password(passwordEncoder.encode("Admin123*"))
                .firstName("Admin")
                .lastName("CupOn")
                .role(Role.ROLE_ADMIN)
                .enabled(true)
                .build();

        userRepository.save(admin);
        log.info("DataSeeder: Admin seed ejecutado exitosamente / Admin123*");
    }
}
