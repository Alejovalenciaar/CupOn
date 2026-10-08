package com.cupon.config;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.cupon.modules.promotion.entity.Category;
import com.cupon.modules.promotion.entity.DiscountType;
import com.cupon.modules.promotion.entity.Promotion;
import com.cupon.modules.promotion.entity.PromotionStatus;
import com.cupon.modules.promotion.repository.CategoryRepository;
import com.cupon.modules.promotion.repository.PromotionRepository;
import com.cupon.modules.user.entity.ApprovalStatus;
import com.cupon.modules.user.entity.ClientProfile;
import com.cupon.modules.user.entity.RestaurantProfile;
import com.cupon.modules.user.entity.Role;
import com.cupon.modules.user.entity.User;
import com.cupon.modules.user.repository.ClientProfileRepository;
import com.cupon.modules.user.repository.RestaurantProfileRepository;
import com.cupon.modules.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final RestaurantProfileRepository restaurantProfileRepository;
    private final CategoryRepository categoryRepository;
    private final PromotionRepository promotionRepository;
    private final PasswordEncoder passwordEncoder;
    private final CacheManager cacheManager;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("DataSeeder: Verificando datos iniciales de desarrollo...");

        seedAdmin();
        seedCategories();
        seedClients();
        seedApprovedRestaurantsAndPromotions();
        seedPendingRestaurants();

        if (cacheManager != null && cacheManager.getCache("promotions") != null) {
            cacheManager.getCache("promotions").clear();
            log.info("DataSeeder: Caché de promociones invalidada.");
        }

        log.info("DataSeeder: Proceso de siembra finalizado exitosamente.");
    }

    private void seedAdmin() {
        if (!userRepository.existsByEmail("admin@cupon.com")) {
            User admin = User.builder()
                    .email("admin@cupon.com")
                    .password(passwordEncoder.encode("Admin123*"))
                    .firstName("Admin")
                    .lastName("CupOn")
                    .role(Role.ROLE_ADMIN)
                    .enabled(true)
                    .build();

            userRepository.save(admin);
            log.info("DataSeeder: Admin creado -> admin@cupon.com / Admin123*");
        } else {
            userRepository.findByEmail("admin@cupon.com").ifPresent(admin -> {
                admin.setPassword(passwordEncoder.encode("Admin123*"));
                admin.setEnabled(true);
                userRepository.save(admin);
            });
        }
    }

    private void seedCategories() {
        if (categoryRepository.count() == 0) {
            List<Category> categories = List.of(
                    Category.builder().name("Comida Rápida").description("Hamburguesas, pizzas, hotdogs y más").iconUrl("fast-food").build(),
                    Category.builder().name("Comida Mexicana").description("Tacos, burritos, enchiladas y platillos típicos").iconUrl("taco").build(),
                    Category.builder().name("Sushi").description("Sushi, rolls y comida japonesa").iconUrl("sushi").build(),
                    Category.builder().name("Postres").description("Pasteles, helados, dulces y repostería").iconUrl("dessert").build(),
                    Category.builder().name("Bebidas").description("Cafés, jugos, smoothies y cócteles").iconUrl("drink").build(),
                    Category.builder().name("Comida Saludable").description("Ensaladas, bowls y opciones fitness").iconUrl("salad").build(),
                    Category.builder().name("Italiana").description("Pastas, pizzas artesanales y risottos").iconUrl("pizza").build(),
                    Category.builder().name("Mariscos").description("Ceviches, cócteles de camarón y pescados").iconUrl("fish").build()
            );
            categoryRepository.saveAll(categories);
            log.info("DataSeeder: Categorías iniciales creadas ({}).", categories.size());
        }
    }

    private void seedClients() {
        createClientUser(
                "cliente@cupon.com",
                "Cliente123*",
                "Alejandro",
                "Gómez",
                "+57 315 999 8877",
                Map.of("city", "Bogotá", "notifications", true)
        );

        createClientUser(
                "cliente1@cupon.com",
                "Cliente123*",
                "Sofía",
                "Morales",
                "+57 310 111 2233",
                Map.of("city", "Medellín", "notifications", true)
        );

        createClientUser(
                "cliente2@cupon.com",
                "Cliente123*",
                "Mateo",
                "Restrepo",
                "+57 320 444 5566",
                Map.of("city", "Cali", "notifications", false)
        );

        createClientUser(
                "maria.cliente@cupon.com",
                "Cliente123*",
                "María Fernanda",
                "López",
                "+57 300 777 8899",
                Map.of("city", "Bogotá", "notifications", true)
        );
    }

    private void createClientUser(String email, String rawPassword, String firstName, String lastName,
                                  String phone, Map<String, Object> preferences) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(rawPassword))
                    .firstName(firstName)
                    .lastName(lastName)
                    .role(Role.ROLE_CLIENTE)
                    .enabled(true)
                    .build();
            user = userRepository.save(user);

            ClientProfile profile = ClientProfile.builder()
                    .user(user)
                    .phoneNumber(phone)
                    .preferences(preferences)
                    .build();
            clientProfileRepository.save(profile);

            log.info("DataSeeder: Cliente creado -> {} / {}", email, rawPassword);
        } else {
            // Actualizar contraseña conocida para que siempre pueda iniciar sesión en desarrollo
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setEnabled(true);
            userRepository.save(user);

            if (clientProfileRepository.findByUserId(user.getId()).isEmpty()) {
                ClientProfile profile = ClientProfile.builder()
                        .user(user)
                        .phoneNumber(phone)
                        .preferences(preferences)
                        .build();
                clientProfileRepository.save(profile);
            }
        }
    }

    private void seedApprovedRestaurantsAndPromotions() {
        // Sincronizar cuentas previas si existen
        syncExistingRestaurantUser("burgerhouse@cupon.com", "Resto123*");
        syncExistingRestaurantUser("tacochingon@cupon.com", "Resto123*");
        syncExistingRestaurantUser("sakurasushi@cupon.com", "Resto123*");

        // 1. Burger House (Zona T, Bogotá)
        RestaurantProfile burgerHouse = createOrGetRestaurant(
                "restaurante1@cupon.com",
                "Resto123*",
                "Carlos",
                "Gómez",
                "Burger House",
                "Las mejores hamburguesas artesanales a la parrilla, carnes maduradas y papas rústicas con salsa de la casa.",
                "Calle 93 # 12-45, Bogotá",
                "+57 300 123 4567",
                "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=250&fit=crop",
                ApprovalStatus.APPROVED
        );
        createPromotionIfNotExists(
                burgerHouse,
                "BURGER30",
                "Combo Doble Burger + Papas Rústicas",
                "30% de descuento en el combo Doble Cheeseburger artesanal con papas rústicas y bebida fría.",
                DiscountType.PERCENTAGE,
                new BigDecimal("30.00"),
                new BigDecimal("32000.00"),
                "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
                List.of("Comida Rápida"),
                Set.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)
        );
        createPromotionIfNotExists(
                burgerHouse,
                "BBQ2X1",
                "2x1 en Hamburguesas Clásicas BBQ",
                "Pide una Burger BBQ con tocineta crocante y lleva la segunda totalmente gratis.",
                DiscountType.PERCENTAGE,
                new BigDecimal("50.00"),
                new BigDecimal("28000.00"),
                "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=400&fit=crop",
                List.of("Comida Rápida"),
                Set.of(DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)
        );
        createPromotionIfNotExists(
                burgerHouse,
                "BURGERCOMBO",
                "Super Combo Familiar Burger $18.000 OFF",
                "Disfruta de 4 hamburguesas sencillas, 2 porciones de papas grandes y gaseosa familiar con $18.000 de descuento.",
                DiscountType.FIXED_AMOUNT,
                new BigDecimal("18000.00"),
                new BigDecimal("55000.00"),
                "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&h=400&fit=crop",
                List.of("Comida Rápida", "Bebidas"),
                Set.of(DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)
        );

        // 2. Taco Chingón (Usaquén, Bogotá)
        RestaurantProfile tacoChingon = createOrGetRestaurant(
                "restaurante2@cupon.com",
                "Resto123*",
                "María",
                "Rodríguez",
                "Taco Chingón",
                "Auténtica comida callejera mexicana: tacos al pastor al trompo, burritos gigantes, nachos y margaritas.",
                "Carrera 7 # 116-20, Bogotá",
                "+57 310 987 6543",
                "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=250&fit=crop",
                ApprovalStatus.APPROVED
        );
        createPromotionIfNotExists(
                tacoChingon,
                "TACOS15",
                "Taquiza de 6 Tacos al Pastor",
                "Descuento de $15.000 en la taquiza clásica con tortillas de maíz nixtamalizado, piña asada y salsas de la casa.",
                DiscountType.FIXED_AMOUNT,
                new BigDecimal("15000.00"),
                new BigDecimal("38000.00"),
                "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&h=400&fit=crop",
                List.of("Comida Mexicana"),
                Set.of(DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)
        );
        createPromotionIfNotExists(
                tacoChingon,
                "MARGARITA2X1",
                "2x1 en Margaritas de la Casa",
                "Ven con tus amigos y disfruta de 2x1 en todas nuestras margaritas artesanales de maracuyá, limón y fresa.",
                DiscountType.PERCENTAGE,
                new BigDecimal("50.00"),
                new BigDecimal("22000.00"),
                "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=400&fit=crop",
                List.of("Comida Mexicana", "Bebidas"),
                Set.of(DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY)
        );

        // 3. Sakura Sushi Bar (Chapinero, Bogotá)
        RestaurantProfile sakuraSushi = createOrGetRestaurant(
                "restaurante3@cupon.com",
                "Resto123*",
                "Kenji",
                "Tanaka",
                "Sakura Sushi Bar",
                "Rolls tradicionales y de autor, sashimis frescos, gyozas y ramen preparado con ingredientes premium importados.",
                "Calle 70 # 9-11, Bogotá",
                "+57 320 555 1234",
                "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=250&fit=crop",
                ApprovalStatus.APPROVED
        );
        createPromotionIfNotExists(
                sakuraSushi,
                "SAKURA2X1",
                "2x1 en Rolls Especiales Ojo de Tigre",
                "2x1 en nuestro roll estrella: salmón tempura crocante, queso crema suave, aguacate fresco y salsa anguila.",
                DiscountType.PERCENTAGE,
                new BigDecimal("50.00"),
                new BigDecimal("42000.00"),
                "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop",
                List.of("Sushi"),
                Set.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY)
        );
        createPromotionIfNotExists(
                sakuraSushi,
                "SUSHIBOX30",
                "Barco Sakura 30 Piezas Mixtas",
                "25% de descuento en el barco variado de 30 piezas (makis, uramakis de salmón y atún y nigiris frescos).",
                DiscountType.PERCENTAGE,
                new BigDecimal("25.00"),
                new BigDecimal("65000.00"),
                "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&h=400&fit=crop",
                List.of("Sushi"),
                Set.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)
        );

        // 4. Bella Italia Trattoria (Parque 93, Bogotá)
        RestaurantProfile bellaItalia = createOrGetRestaurant(
                "restaurante4@cupon.com",
                "Resto123*",
                "Gianluigi",
                "Rossi",
                "Bella Italia Trattoria",
                "Rincón gastronómico italiano con pastas artesanales hechas en casa, pizzas a la leña y selección de vinos.",
                "Carrera 11 # 85-32, Bogotá",
                "+57 318 444 9876",
                "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop",
                ApprovalStatus.APPROVED
        );
        createPromotionIfNotExists(
                bellaItalia,
                "PIZZA2X1",
                "2x1 en Pizzas Medianas al Horno de Leña",
                "Lleva dos pizzas artesanales pagando solo una. Válido para Margherita clásica, Pepperoni y Cuatro Quesos.",
                DiscountType.PERCENTAGE,
                new BigDecimal("50.00"),
                new BigDecimal("36000.00"),
                "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop",
                List.of("Italiana"),
                Set.of(DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.SUNDAY)
        );
        createPromotionIfNotExists(
                bellaItalia,
                "PASTALOVER",
                "30% OFF en Pastas Frescas de la Casa",
                "Fettuccine Alfredo, Lasagna Boloñesa y Raviolis de Ricotta con 30% de descuento de lunes a viernes.",
                DiscountType.PERCENTAGE,
                new BigDecimal("30.00"),
                new BigDecimal("30000.00"),
                "https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=600&h=400&fit=crop",
                List.of("Italiana"),
                Set.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)
        );

        // 5. Verde Vivo Bowls (Cedritos, Bogotá)
        RestaurantProfile verdeVivo = createOrGetRestaurant(
                "restaurante5@cupon.com",
                "Resto123*",
                "Valentina",
                "Restrepo",
                "Verde Vivo Bowls",
                "Comida saludable pensada en tu bienestar: poke bowls personalizados, ensaladas nutritivas y smoothies sin azúcar añadida.",
                "Calle 140 # 15-28, Bogotá",
                "+57 312 888 7766",
                "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop",
                ApprovalStatus.APPROVED
        );
        createPromotionIfNotExists(
                verdeVivo,
                "BOWLHEALTHY",
                "20% OFF en Poke Bowls y Ensaladas Gourmet",
                "Arma tu bowl saludable con base de quinoa o arroz integral, salmón fresco o tofu y aderezo tahini.",
                DiscountType.PERCENTAGE,
                new BigDecimal("20.00"),
                new BigDecimal("26000.00"),
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
                List.of("Comida Saludable"),
                Set.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)
        );
        createPromotionIfNotExists(
                verdeVivo,
                "SMOOTHIEFREE",
                "Bono $12.000 Descuento en Smoothies y Bowls",
                "Ahorra $12.000 en la compra de tu bowl favorito acompañado de cualquier smoothie frutal revitalizante.",
                DiscountType.FIXED_AMOUNT,
                new BigDecimal("12000.00"),
                new BigDecimal("32000.00"),
                "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&h=400&fit=crop",
                List.of("Comida Saludable", "Bebidas"),
                Set.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)
        );

        // 6. Dulce Pecado Bakery (El Poblado, Medellín)
        RestaurantProfile dulcePecado = createOrGetRestaurant(
                "restaurante6@cupon.com",
                "Resto123*",
                "Camila",
                "Ochoa",
                "Dulce Pecado Bakery",
                "Repostería de alta gama con cheesecakes neoyorquinos, tortas de autor, croissants franceses y café de especialidad.",
                "Carrera 37 # 10-42, El Poblado, Medellín",
                "+57 301 222 3344",
                "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=250&fit=crop",
                ApprovalStatus.APPROVED
        );
        createPromotionIfNotExists(
                dulcePecado,
                "DULCE20",
                "20% OFF en Tartas y Tortas de Celebración",
                "20% de descuento en cualquier tarta completa para tus eventos especiales y cumpleaños familiares.",
                DiscountType.PERCENTAGE,
                new BigDecimal("20.00"),
                new BigDecimal("35000.00"),
                "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop",
                List.of("Postres"),
                Set.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)
        );
        createPromotionIfNotExists(
                dulcePecado,
                "CAFEPOSTRE",
                "Combo Café Latte + Cheesecake con $8.000 OFF",
                "Disfruta de una tarde dulce con café de origen y porción de cheesecake con $8.000 de rebaja.",
                DiscountType.FIXED_AMOUNT,
                new BigDecimal("8000.00"),
                new BigDecimal("22000.00"),
                "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&h=400&fit=crop",
                List.of("Postres", "Bebidas"),
                Set.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)
        );

        // 7. Fuego & Carbón BBQ (Provenza, Medellín)
        RestaurantProfile fuegoCarbon = createOrGetRestaurant(
                "restaurante7@cupon.com",
                "Resto123*",
                "Juan Pablo",
                "Montoya",
                "Fuego & Carbón BBQ",
                "Cortes de carne premium ahumados a fuego lento estilo Texas BBQ: brisket, ribs bañadas en miel de maple y alitas.",
                "Calle 8 # 42-15, Provenza, Medellín",
                "+57 314 777 6543",
                "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop",
                ApprovalStatus.APPROVED
        );
        createPromotionIfNotExists(
                fuegoCarbon,
                "BBQRIBS",
                "25% OFF en Costillas BBQ Ahumadas",
                "Costillar completo glaseado con salsa BBQ de la casa, mazorca dulce a la parrilla y ensalada coleslaw.",
                DiscountType.PERCENTAGE,
                new BigDecimal("25.00"),
                new BigDecimal("45000.00"),
                "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop",
                List.of("Comida Rápida"),
                Set.of(DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)
        );

        // 8. La Cervecería Capital (Laureles, Medellín)
        RestaurantProfile cerveceria = createOrGetRestaurant(
                "restaurante8@cupon.com",
                "Resto123*",
                "Andrés",
                "Morales",
                "La Cervecería Capital",
                "Pub cervecero con más de 12 líneas de cerveza artesanal en barril, hamburguesas smash y picadas para compartir.",
                "Circular 4 # 73-12, Laureles, Medellín",
                "+57 316 333 9900",
                "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop",
                ApprovalStatus.APPROVED
        );
        createPromotionIfNotExists(
                cerveceria,
                "BEERHAPPY",
                "Happy Hour: 3x2 en Pints Artesanales",
                "Pide tres pintas de cualquier cerveza de barril (IPA, Stout, Blonde) y paga únicamente dos.",
                DiscountType.PERCENTAGE,
                new BigDecimal("33.33"),
                new BigDecimal("30000.00"),
                "https://images.unsplash.com/photo-1608270191538-4e897df8645e?w=600&h=400&fit=crop",
                List.of("Bebidas"),
                Set.of(DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY)
        );
    }

    private void seedPendingRestaurants() {
        createOrGetRestaurant(
                "pendiente1@cupon.com",
                "Resto123*",
                "Lucía",
                "Vargas",
                "Arepas de la Esquina",
                "Arepas de choclo y maíz blanco rellenas con queso doble crema, carne desmechada y hogao tradicional.",
                "Carrera 15 # 82-10, Bogotá",
                "+57 315 123 7890",
                "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=250&fit=crop",
                ApprovalStatus.PENDING
        );

        createOrGetRestaurant(
                "pendiente2@cupon.com",
                "Resto123*",
                "Sebastián",
                "Ríos",
                "Waffles & Shakes Gourmet",
                "Waffles belgas crujientes con toppings ilimitados, helado artesanal y malteadas de la casa.",
                "Carrera 43A # 1-50, Medellín",
                "+57 304 987 1234",
                "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&h=250&fit=crop",
                ApprovalStatus.PENDING
        );

        createOrGetRestaurant(
                "pendiente3@cupon.com",
                "Resto123*",
                "Mariana",
                "Botero",
                "Donas Artesanales & Café",
                "Donas glaseadas recién horneadas con rellenos gourmet: arequipe, nutella, frutos rojos y maracuyá.",
                "Avenida 6 Norte # 24N, Cali",
                "+57 311 456 2345",
                "https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?w=400&h=250&fit=crop",
                ApprovalStatus.PENDING
        );
    }

    private RestaurantProfile createOrGetRestaurant(String email, String rawPassword, String firstName,
                                                    String lastName, String businessName, String description,
                                                    String address, String phone, String logoUrl,
                                                    ApprovalStatus status) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(rawPassword))
                    .firstName(firstName)
                    .lastName(lastName)
                    .role(Role.ROLE_RESTAURANTE)
                    .enabled(true)
                    .build();
            user = userRepository.save(user);

            RestaurantProfile profile = RestaurantProfile.builder()
                    .user(user)
                    .businessName(businessName)
                    .description(description)
                    .address(address)
                    .phoneNumber(phone)
                    .logoUrl(logoUrl)
                    .approvalStatus(status)
                    .build();
            profile = restaurantProfileRepository.save(profile);

            log.info("DataSeeder: Restaurante creado -> {} ({}) / Status: {}", email, businessName, status);
            return profile;
        } else {
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setEnabled(true);
            userRepository.save(user);

            final User existingUser = user;
            return restaurantProfileRepository.findByUserId(user.getId())
                    .orElseGet(() -> {
                        RestaurantProfile profile = RestaurantProfile.builder()
                                .user(existingUser)
                                .businessName(businessName)
                                .description(description)
                                .address(address)
                                .phoneNumber(phone)
                                .logoUrl(logoUrl)
                                .approvalStatus(status)
                                .build();
                        return restaurantProfileRepository.save(profile);
                    });
        }
    }

    private void syncExistingRestaurantUser(String email, String rawPassword) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setEnabled(true);
            userRepository.save(user);
            log.info("DataSeeder: Contraseña actualizada para restaurante existente -> {}", email);
        });
    }

    private void createPromotionIfNotExists(RestaurantProfile restaurant, String code, String title,
                                            String description, DiscountType discountType, BigDecimal discountValue,
                                            BigDecimal minPurchase, String imageUrl, List<String> categoryNames,
                                            Set<DayOfWeek> daysOfWeek) {
        if (promotionRepository.existsByCode(code)) {
            return;
        }

        Set<Category> categories = new HashSet<>();
        for (String catName : categoryNames) {
            categoryRepository.findByName(catName).ifPresent(categories::add);
        }

        Promotion promo = Promotion.builder()
                .restaurantProfile(restaurant)
                .code(code)
                .title(title)
                .description(description)
                .discountType(discountType)
                .discountValue(discountValue)
                .minPurchase(minPurchase)
                .startDate(LocalDateTime.now().minusDays(5))
                .endDate(LocalDateTime.now().plusDays(90))
                .maxRedemptions(150)
                .currentRedemptions(0)
                .status(PromotionStatus.ACTIVE)
                .imageUrl(imageUrl)
                .categories(categories)
                .daysOfWeek(new HashSet<>(daysOfWeek))
                .build();

        promotionRepository.save(promo);
        log.info("DataSeeder: Promoción creada -> [{}] {} ({})", code, title, restaurant.getBusinessName());
    }
}

