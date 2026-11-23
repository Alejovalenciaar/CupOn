package com.cupon.config;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
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

    private static final int TOTAL_APPROVED_RESTAURANTS = 300;

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final RestaurantProfileRepository restaurantProfileRepository;
    private final CategoryRepository categoryRepository;
    private final PromotionRepository promotionRepository;
    private final PasswordEncoder passwordEncoder;
    private final CacheManager cacheManager;

    private final Map<String, String> encodedPasswordsCache = new HashMap<>();
    private final Map<String, Category> categoryCache = new HashMap<>();

    private record CityZone(String city, String zone, String streetPrefix, double baseLat, double baseLng) {}

    private record CuisineConcept(
            String cuisineType,
            String categoryName,
            String secondaryCategory,
            String[] brandPrefixes,
            String[] brandSuffixes,
            String[] descriptions,
            String[] logos,
            String[] promoImages,
            String[] signatureDishes
    ) {}

    private record PromoMotiveTemplate(
            String codePrefix,
            String motiveTag,
            String titleTemplate,
            String descriptionTemplate,
            DiscountType discountType,
            BigDecimal discountValue,
            BigDecimal minPurchase,
            Set<DayOfWeek> daysOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            boolean dynamicPricing,
            Integer stage1Limit,
            BigDecimal stage1Value,
            BigDecimal stage2Value
    ) {}

    private static final List<CityZone> CITY_ZONES = List.of(
            new CityZone("Bogotá", "Zona T", "Calle 82", 4.6672, -74.0535),
            new CityZone("Bogotá", "Parque 93", "Carrera 13", 4.6768, -74.0482),
            new CityZone("Bogotá", "Usaquén", "Carrera 6A", 4.6953, -74.0308),
            new CityZone("Bogotá", "Chapinero Alto", "Calle 65", 4.6486, -74.0568),
            new CityZone("Bogotá", "Cedritos", "Calle 140", 4.7218, -74.0419),
            new CityZone("Bogotá", "Zona G", "Calle 70", 4.6531, -74.0547),
            new CityZone("Bogotá", "La Macarena", "Carrera 4A", 4.6134, -74.0660),
            new CityZone("Medellín", "El Poblado", "Carrera 37", 6.2091, -75.5678),
            new CityZone("Medellín", "Provenza", "Calle 8", 6.2082, -75.5656),
            new CityZone("Medellín", "Laureles", "Circular 4", 6.2451, -75.5917),
            new CityZone("Medellín", "Envigado", "Calle 38 Sur", 6.1696, -75.5874),
            new CityZone("Medellín", "Manila", "Calle 12", 6.2125, -75.5718),
            new CityZone("Cali", "Granada", "Avenida 9 Norte", 3.4589, -76.5342),
            new CityZone("Cali", "El Peñón", "Calle 3 Oeste", 3.4508, -76.5419),
            new CityZone("Cali", "Ciudad Jardín", "Carrera 105", 3.3682, -76.5335),
            new CityZone("Cali", "San Antonio", "Calle 2", 3.4465, -76.5403),
            new CityZone("Barranquilla", "Alto Prado", "Carrera 53", 11.0018, -74.8015),
            new CityZone("Barranquilla", "Buenavista", "Calle 98", 11.0142, -74.8261),
            new CityZone("Cartagena", "Bocagrande", "Avenida San Martín", 10.4052, -75.5536),
            new CityZone("Cartagena", "Getsemaní", "Calle del Arsenal", 10.4216, -75.5458),
            new CityZone("Bucaramanga", "Cabecera del Llano", "Carrera 35", 7.1182, -73.1105),
            new CityZone("Pereira", "Pinares", "Avenida Circunvalar", 4.8087, -75.6821),
            new CityZone("Manizales", "Milán", "Carrera 23", 5.0562, -75.4851),
            new CityZone("Santa Marta", "Parque de los Novios", "Calle 19", 11.2421, -74.2128)
    );

    private static final String[] OWNER_FIRST_NAMES = {
            "Santiago", "Valentina", "Sebastián", "Camila", "Alejandro", "Isabella",
            "Nicolás", "Mariana", "Mateo", "Gabriela", "Daniel", "Laura",
            "Andrés", "Natalia", "Felipe", "Paula", "Juan Martín", "Juliana",
            "Esteban", "Carolina", "Tomás", "Manuela", "Samuel", "Catalina"
    };

    private static final String[] OWNER_LAST_NAMES = {
            "Gómez", "Restrepo", "Jaramillo", "Cárdenas", "Montoya", "Salazar",
            "Ospina", "Echeverri", "Mejía", "Londoño", "Arango", "Velásquez",
            "Castaño", "Betancur", "Giraldo", "Uribe", "Quintero", "Pineda"
    };

    private static final List<CuisineConcept> CUISINE_CONCEPTS = List.of(
            new CuisineConcept(
                    "Hamburguesas & Parrilla",
                    "Comida Rápida",
                    "Bebidas",
                    new String[]{"La Brasa", "Smash & Co.", "El Galpón", "humo & Fierro", "Garage", "Bistró", "Brooklyn", " Bastión", "Rústico", "feria"},
                    new String[]{"Burger Lab", "Steak & Grill", "Smash Burgers", "Grill House", "Craft Burgers", "Asador Urbano"},
                    new String[]{
                            "Hamburguesas smash en pan brioche artesanal, cortes madurados al carbón y papas trufadas con alioli de la casa.",
                            "Cocina de fuego lento con carnes certificadas, costillas glaseadas, chorizos artesanales y cervezas locales.",
                            "Especialistas en burgers de doble medallón Angus, tocineta ahumada en leña de manzano y malteadas cremosas."
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=250&fit=crop",
                            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop",
                            "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=250&fit=crop"
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop"
                    },
                    new String[]{"Doble Smash Trufada", "Costillas St. Louis BBQ", "Combo Burger Madurada + Papas"}
            ),
            new CuisineConcept(
                    "Cocina Mexicana",
                    "Comida Mexicana",
                    "Bebidas",
                    new String[]{"Cantina", "Taquería", "Casa", "El Rincón", "Cielito", "Lupita", "Oaxaca", "Jalisco", "Agave", "La Chingada"},
                    new String[]{"Coyoacán", "Tacos & Mezcal", "Cocina Azteca", "Gastro Cantina", "Taquería Artesanal", "Agave & Maíz"},
                    new String[]{
                            "Tortillas de maíz nixtamalizado hechas al momento, tacos de birria con consomé, guacamole en molcajete y mezcales.",
                            "Sabores auténticos de Oaxaca y Jalisco: pastor al trompo, quesabirrias crocantes, elotes callejeros y margaritas de autor.",
                            "Cantina mexicana contemporánea con flautas, burritos al carbón, nachos fundidos y coctelería con tequila reposado."
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=250&fit=crop",
                            "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=250&fit=crop"
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=400&fit=crop"
                    },
                    new String[]{"Taquiza de Birria & Pastor", "Molcajete Mixto + Margaritas", "Quesabirrias & Guacamole"}
            ),
            new CuisineConcept(
                    "Japonesa & Nikkei",
                    "Sushi",
                    "Mariscos",
                    new String[]{"Koi", "Shibuya", "Kyoto", "Hanami", "Akira", "Nori", "Osaka", "Tenshi", "Umami", "Kuro"},
                    new String[]{"Sushi & Nikkei", "Izakaya Bar", "Ramen & Rolls", "Omakase House", "Asian Kitchen", "Sushi Lounge"},
                    new String[]{
                            "Fusión japonesa-peruana con tiraditos de salmón, rolls flameados al wok, nigiris de pesca fresca y ramen tonkotsu.",
                            "Izakaya moderno especializado en makis de autor, baos al vapor, gyozas crocantes y coctelería oriental con yuzu.",
                            "Barra de sushi premium con cortes frescos del día, barcos variados para compartir y entradas calientes al teppanyaki."
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=250&fit=crop",
                            "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=250&fit=crop"
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=400&fit=crop"
                    },
                    new String[]{"Rolls Nikkei Flameados", "Barco Omakase 24 Piezas", "Ramen Tonkotsu & Gyozas"}
            ),
            new CuisineConcept(
                    "Italiana & Pizzería",
                    "Italiana",
                    "Bebidas",
                    new String[]{"Trattoria", "Osteria", "Forno", "Villa", "Casa", "Nonna", "Piazza", "Amalfi", "Toscana", "Napoli"},
                    new String[]{"Forno a Legna", "Pasta & Vino", "Trattoria Artigianale", "Cucina Italiana", "Pizza Napoletana", "Ristorante"},
                    new String[]{
                            "Pizzas napolitanas de fermentación lenta horneadas a 450°C, pastas frescas al huevo, burrata artesanal y tiramisú.",
                            "Recetas tradicionales de la Toscana con risottos cremosos, raviolis rellenos a mano, focaccias y vinos de guarda.",
                            "Ambiente acogedor italiano con lasagnas gratinadas al horno de leña, antipastos mediterráneos y sangría de la casa."
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop",
                            "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=250&fit=crop"
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop"
                    },
                    new String[]{"Pizzas Napolitanas a la Leña", "Pastas Frescas & Risottos", "Antipasto + Lasagna Artesanal"}
            ),
            new CuisineConcept(
                    "Saludable & Poke Bowls",
                    "Comida Saludable",
                    "Bebidas",
                    new String[]{"Aloha", "Raíz", "Botánica", "Pura Vida", "Fresca", "Vital", "Origen", "Natura", "Semilla", "Savia"},
                    new String[]{"Poke & Bowls", "Healthy Kitchen", "Salad & Juice Bar", "Organic Market", "Green Bistro", "Fit Food"},
                    new String[]{
                            "Poke bowls hawaianos con salmón y atún fresco, wraps integrales, ensaladas tibias de quinoa y jugos prensados en frío.",
                            "Cocina consciente y balanceada con ingredientes locales orgánicos, opciones keto, veganas y postres libres de azúcar.",
                            "Bowls nutritivos armados a tu gusto con proteínas limpias, aderezos artesanales sin conservantes y kombucha."
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop",
                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=250&fit=crop"
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop"
                    },
                    new String[]{"Poke Bowl Salmón & Quinoa", "Bowl Proteico + Smoothie", "Wrap Mediterráneo & Jugo Cold-Press"}
            ),
            new CuisineConcept(
                    "Repostería & Café de Especialidad",
                    "Postres",
                    "Bebidas",
                    new String[]{"Maison", "Atelier", "Miel & Canela", "Cacao", "Velvet", "Brûlée", "Macaron", "Aroma", "L'Éclair", "Brunch"},
                    new String[]{"Pâtisserie & Café", "Bakery House", "Specialty Coffee", "Chocolatería & Brunch", "Boulangerie", "Sweet Studio"},
                    new String[]{
                            "Pastelería francesa artesanal, croissants de mantequilla laminados a diario, tortas de autor y café de origen colombiano.",
                            "Brunch todo el día con waffles belgas, tostadas francesas, cheesecakes horneados y métodos de filtrado V60 y Chemex.",
                            "Rincón dulce especializado en milhojas crocantes, brownies melcochudos con helado artesanal y bebidas con matcha."
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=250&fit=crop",
                            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=250&fit=crop"
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop"
                    },
                    new String[]{"Cheesecake & Café de Origen", "Brunch para Dos + Croissants", "Tarta Artesanal & Cappuccino"}
            ),
            new CuisineConcept(
                    "Cevichera & Mariscos",
                    "Mariscos",
                    "Bebidas",
                    new String[]{"Puerto", "Marea", "Altamar", "El Muelle", "Pacífico", "Coral", "Brisa", "Nazca", "Callao", "Ancla"},
                    new String[]{"Cevichería Peruana", "Mar & Brasas", "Cocina de Mar", "Seafood & Bar", "Pescadería Gourmet", "Sabores del Pacífico"},
                    new String[]{
                            "Ceviches peruanos con leche de tigre al ají amarillo, arroz chaufa de mariscos, jalea real crocante y pisco sours.",
                            "Cocina costera con cazuela de mariscos cremosa, encocado de camarón, pulpo a la parrilla y limonada de coco.",
                            "Pesca fresca sostenible traída a diario desde el Pacífico y el Caribe, tiraditos cítricos y langostinos al ajillo."
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=250&fit=crop",
                            "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=250&fit=crop"
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=400&fit=crop"
                    },
                    new String[]{"Ceviche Clásico & Leche de Tigre", "Cazuela de Mariscos & Coco", "Chaufa de Mariscos + Pisco Sour"}
            ),
            new CuisineConcept(
                    "Gastrobar & Cervecería Artesanal",
                    "Bebidas",
                    "Comida Rápida",
                    new String[]{"La Destilería", "El Taproom", "Barril", "Lúpulo", "Abadía", "Bodega", "Maltas", "La Taberna", "El Clandestino", "Alquimia"},
                    new String[]{"Craft Beer & Tapas", "Gastro Pub", "Brewery & Grill", "Cocktail & Tapas Bar", "Cervecería Artesanal", "Rooftop Bar"},
                    new String[]{
                            "Más de 16 barriles rotativos de cerveza artesanal independiente, alitas búfalo, nachos ahumados y picadas cerveceras.",
                            "Coctelería de autor, gin tonics botánicos, tapas españolas, tabla de quesos madurados y música en vivo.",
                            "Taproom urbano con IPAs, Stouts y Red Ales recién embarriladas, acompañadas de sliders gourmet y papas bravas."
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop",
                            "https://images.unsplash.com/photo-1608270191538-4e897df8645e?w=400&h=250&fit=crop"
                    },
                    new String[]{
                            "https://images.unsplash.com/photo-1608270191538-4e897df8645e?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=400&fit=crop",
                            "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&h=400&fit=crop"
                    },
                    new String[]{"Pintas Artesanales & Picada", "Coctelería de Autor & Tapas", "Flight Cervecero + Alitas"}
            )
    );

    private static final List<PromoMotiveTemplate> PROMO_MOTIVES = List.of(
            // 1. Happy Hour / Tardeo
            new PromoMotiveTemplate(
                    "HAPPY",
                    "Happy Hour & Tardeo",
                    "Happy Hour: 2x1 en %s",
                    "Motivo: Tardeo & Happy Hour. Disfruta de 2x1 en %s en %s entre las 3:00 p. m. y las 7:00 p. m.",
                    DiscountType.PERCENTAGE,
                    new BigDecimal("50.00"),
                    new BigDecimal("28000.00"),
                    Set.of(DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY),
                    LocalTime.of(15, 0),
                    LocalTime.of(19, 0),
                    false, null, null, null
            ),
            // 2. Especial de Almuerzo Ejecutivo
            new PromoMotiveTemplate(
                    "LUNCH",
                    "Almuerzo Ejecutivo",
                    "Especial Almuerzo: 25%% OFF en %s",
                    "Motivo: Almuerzo entre semana. Recibe 25%% de descuento en %s acompañado de entrada y bebida del día en %s.",
                    DiscountType.PERCENTAGE,
                    new BigDecimal("25.00"),
                    new BigDecimal("25000.00"),
                    Set.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY),
                    LocalTime.of(12, 0),
                    LocalTime.of(15, 30),
                    false, null, null, null
            ),
            // 3. Plan Fin de Semana Familiar
            new PromoMotiveTemplate(
                    "FAMILIA",
                    "Plan Familiar de Fin de Semana",
                    "Combo Familiar Fin de Semana: $20.000 OFF en %s",
                    "Motivo: Fin de Semana en Familia. Ahorra $20.000 COP compartiendo %s para 3 o 4 personas en %s.",
                    DiscountType.FIXED_AMOUNT,
                    new BigDecimal("20000.00"),
                    new BigDecimal("65000.00"),
                    Set.of(DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY),
                    null, null,
                    false, null, null, null
            ),
            // 4. Martes & Miércoles de Amigos (Mitad de Semana)
            new PromoMotiveTemplate(
                    "AMIGOS",
                    "Mitad de Semana con Amigos",
                    "Miércoles de Amigos: 30%% OFF en %s",
                    "Motivo: Cortar la semana con amigos. Aprovecha 30%% de descuento en %s todos los martes y miércoles en %s.",
                    DiscountType.PERCENTAGE,
                    new BigDecimal("30.00"),
                    new BigDecimal("34000.00"),
                    Set.of(DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY),
                    null, null,
                    false, null, null, null
            ),
            // 5. Noche de Pareja / Cena Romántica
            new PromoMotiveTemplate(
                    "CENA",
                    "Noche de Pareja & Maridaje",
                    "Cena para Dos: $18.000 OFF en %s",
                    "Motivo: Noche de Pareja. Descuento directo de $18.000 COP en tu cena para dos con %s en %s.",
                    DiscountType.FIXED_AMOUNT,
                    new BigDecimal("18000.00"),
                    new BigDecimal("55000.00"),
                    Set.of(DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY),
                    LocalTime.of(18, 0),
                    LocalTime.of(22, 30),
                    false, null, null, null
            ),
            // 6. Precio Dinámico Escalonado (Simplex) - Campaña Flash
            new PromoMotiveTemplate(
                    "FLASH",
                    "Oferta Escalonada Simplex (Cupos Limitados)",
                    "Promo Escalonada Flash: Hasta 35%% OFF en %s",
                    "Motivo: Campaña de Precio Dinámico Escalonado. Inicia con 22%% OFF en etapa normal y sube a 35%% OFF en etapa de última hora para %s en %s.",
                    DiscountType.PERCENTAGE,
                    new BigDecimal("22.00"),
                    new BigDecimal("32000.00"),
                    Set.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY),
                    null, null,
                    true, 45, new BigDecimal("22.00"), new BigDecimal("35.00")
            ),
            // 7. Celebración de Cumpleaños & Aniversario
            new PromoMotiveTemplate(
                    "CELEBRA",
                    "Celebración & Cumpleaños",
                    "Especial Celebración: 35%% OFF en %s",
                    "Motivo: Mes de Cumpleaños o Aniversario. Celebra en tu mesa con 35%% de descuento en %s y postre de cortesía en %s.",
                    DiscountType.PERCENTAGE,
                    new BigDecimal("35.00"),
                    new BigDecimal("48000.00"),
                    Set.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY),
                    null, null,
                    false, null, null, null
            ),
            // 8. Lanzamiento de Temporada / Especial del Chef
            new PromoMotiveTemplate(
                    "CHEF",
                    "Lanzamiento Especial del Chef",
                    "Temporada del Chef: $14.000 OFF en %s",
                    "Motivo: Lanzamiento de nueva carta. Prueba nuestra receta insignia de %s con $14.000 de bono en %s.",
                    DiscountType.FIXED_AMOUNT,
                    new BigDecimal("14000.00"),
                    new BigDecimal("40000.00"),
                    Set.of(DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY),
                    null, null,
                    false, null, null, null
            ),
            // 9. Lunes de Antojo / Inicio de Semana
            new PromoMotiveTemplate(
                    "LUNES",
                    "Lunes sin Cocina",
                    "Lunes de Antojo: 40%% OFF en %s",
                    "Motivo: Empezar la semana con buen sabor. Todos los lunes y martes recibe 40%% de descuento en %s en %s.",
                    DiscountType.PERCENTAGE,
                    new BigDecimal("40.00"),
                    new BigDecimal("30000.00"),
                    Set.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY),
                    null, null,
                    false, null, null, null
            ),
            // 10. Bono Primera Visita / Degustación
            new PromoMotiveTemplate(
                    "BIENVENIDA",
                    "Bono de Degustación & Bienvenida",
                    "Bono Degustación: $12.000 OFF en %s",
                    "Motivo: Invitación a conocer nuestra cocina. Redime $12.000 de descuento en %s cualquier día de la semana en %s.",
                    DiscountType.FIXED_AMOUNT,
                    new BigDecimal("12000.00"),
                    new BigDecimal("35000.00"),
                    Set.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY),
                    null, null,
                    false, null, null, null
            ),
            // 11. Jueves de Pre-Fin de Semana / After Office
            new PromoMotiveTemplate(
                    "AFTER",
                    "After Office de Jueves y Viernes",
                    "After Office: 20%% OFF en %s + Bebidas",
                    "Motivo: Salida de oficina. Desconéctate con 20%% de descuento en %s y bebidas seleccionadas en %s.",
                    DiscountType.PERCENTAGE,
                    new BigDecimal("20.00"),
                    new BigDecimal("29000.00"),
                    Set.of(DayOfWeek.THURSDAY, DayOfWeek.FRIDAY),
                    LocalTime.of(16, 30),
                    LocalTime.of(21, 30),
                    false, null, null, null
            ),
            // 12. Domingo de Brunch & Tarde Relax (con Precio Dinámico Simplex)
            new PromoMotiveTemplate(
                    "DOMINGO",
                    "Domingo de Brunch & Familia (Simplex)",
                    "Domingo Especial: Hasta $22.000 OFF en %s",
                    "Motivo: Plan de Domingo. Bono escalonado que inicia en $15.000 OFF y sube a $22.000 OFF en los últimos cupos para %s en %s.",
                    DiscountType.FIXED_AMOUNT,
                    new BigDecimal("15000.00"),
                    new BigDecimal("50000.00"),
                    Set.of(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY),
                    LocalTime.of(11, 0),
                    LocalTime.of(17, 0),
                    true, 30, new BigDecimal("15000.00"), new BigDecimal("22000.00")
            )
    );

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("DataSeeder: Verificando datos iniciales de desarrollo...");

        encodedPasswordsCache.clear();
        categoryCache.clear();

        seedAdmin();
        seedCategories();
        seedClients();
        seedApprovedRestaurantsAndPromotions();
        seedPendingRestaurants();

        if (cacheManager != null && cacheManager.getCache("promotions") != null) {
            cacheManager.getCache("promotions").clear();
            log.info("DataSeeder: Caché de promociones invalidada.");
        }

        log.info("DataSeeder: Proceso de siembra finalizado exitosamente (300 restaurantes aprobados, 12 pendientes).");
    }

    private String encodePasswordCached(String rawPassword) {
        return encodedPasswordsCache.computeIfAbsent(rawPassword, passwordEncoder::encode);
    }

    private Category getCategoryCached(String name) {
        return categoryCache.computeIfAbsent(name,
                n -> categoryRepository.findByName(n).orElse(null));
    }

    private void seedAdmin() {
        if (!userRepository.existsByEmail("admin@cupon.com")) {
            User admin = User.builder()
                    .email("admin@cupon.com")
                    .password(encodePasswordCached("Admin123*"))
                    .firstName("Admin")
                    .lastName("CupOn")
                    .role(Role.ROLE_ADMIN)
                    .enabled(true)
                    .build();

            userRepository.save(admin);
            log.info("DataSeeder: Admin creado -> admin@cupon.com / Admin123*");
        } else {
            userRepository.findByEmail("admin@cupon.com").ifPresent(admin -> {
                admin.setPassword(encodePasswordCached("Admin123*"));
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
                    .password(encodePasswordCached(rawPassword))
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
            user.setPassword(encodePasswordCached(rawPassword));
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

        // =========================================================================
        // 1..8: RESTAURANTES Y CUPONES ORIGINALES (CONSERVADOS INTACTOS)
        //       + cupones complementarios para que cada uno tenga entre 9 y 12
        // =========================================================================

        // 1. Burger House (Zona T, Bogotá) -> 3 originales + 9 complementarios = 12 cupones
        RestaurantProfile burgerHouse = createOrGetRestaurant(
                "restaurante1@cupon.com",
                "Resto123*",
                "Carlos",
                "Gómez",
                "Burger House",
                "Hamburguesas & Parrilla",
                "Las mejores hamburguesas artesanales a la parrilla, carnes maduradas y papas rústicas con salsa de la casa.",
                "Calle 93 # 12-45, Bogotá",
                4.6768,
                -74.0482,
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
        seedPromotionsForRestaurant(burgerHouse, 1, CUISINE_CONCEPTS.get(0), 3, 12);

        // 2. Taco Chingón (Usaquén, Bogotá) -> 2 originales + 8 complementarios = 10 cupones
        RestaurantProfile tacoChingon = createOrGetRestaurant(
                "restaurante2@cupon.com",
                "Resto123*",
                "María",
                "Rodríguez",
                "Taco Chingón",
                "Cocina Mexicana",
                "Auténtica comida callejera mexicana: tacos al pastor al trompo, burritos gigantes, nachos y margaritas.",
                "Carrera 7 # 116-20, Bogotá",
                4.6953,
                -74.0308,
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
        seedPromotionsForRestaurant(tacoChingon, 2, CUISINE_CONCEPTS.get(1), 2, 10);

        // 3. Sakura Sushi Bar (Chapinero, Bogotá) -> 2 originales + 9 complementarios = 11 cupones
        RestaurantProfile sakuraSushi = createOrGetRestaurant(
                "restaurante3@cupon.com",
                "Resto123*",
                "Kenji",
                "Tanaka",
                "Sakura Sushi Bar",
                "Japonesa & Nikkei",
                "Rolls tradicionales y de autor, sashimis frescos, gyozas y ramen preparado con ingredientes premium importados.",
                "Calle 70 # 9-11, Bogotá",
                4.6531,
                -74.0547,
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
        seedPromotionsForRestaurant(sakuraSushi, 3, CUISINE_CONCEPTS.get(2), 2, 11);

        // 4. Bella Italia Trattoria (Parque 93, Bogotá) -> 2 originales + 7 complementarios = 9 cupones
        RestaurantProfile bellaItalia = createOrGetRestaurant(
                "restaurante4@cupon.com",
                "Resto123*",
                "Gianluigi",
                "Rossi",
                "Bella Italia Trattoria",
                "Italiana & Pizzería",
                "Rincón gastronómico italiano con pastas artesanales hechas en casa, pizzas a la leña y selección de vinos.",
                "Carrera 11 # 85-32, Bogotá",
                4.6701,
                -74.0512,
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
        seedPromotionsForRestaurant(bellaItalia, 4, CUISINE_CONCEPTS.get(3), 2, 9);

        // 5. Verde Vivo Bowls (Cedritos, Bogotá) -> 2 originales + 8 complementarios = 10 cupones
        RestaurantProfile verdeVivo = createOrGetRestaurant(
                "restaurante5@cupon.com",
                "Resto123*",
                "Valentina",
                "Restrepo",
                "Verde Vivo Bowls",
                "Saludable & Poke Bowls",
                "Comida saludable pensada en tu bienestar: poke bowls personalizados, ensaladas nutritivas y smoothies sin azúcar añadida.",
                "Calle 140 # 15-28, Bogotá",
                4.7218,
                -74.0419,
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
        seedPromotionsForRestaurant(verdeVivo, 5, CUISINE_CONCEPTS.get(4), 2, 10);

        // 6. Dulce Pecado Bakery (El Poblado, Medellín) -> 2 originales + 9 complementarios = 11 cupones
        RestaurantProfile dulcePecado = createOrGetRestaurant(
                "restaurante6@cupon.com",
                "Resto123*",
                "Camila",
                "Ochoa",
                "Dulce Pecado Bakery",
                "Repostería & Café de Especialidad",
                "Repostería de alta gama con cheesecakes neoyorquinos, tortas de autor, croissants franceses y café de especialidad.",
                "Carrera 37 # 10-42, El Poblado, Medellín",
                6.2091,
                -75.5678,
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
        seedPromotionsForRestaurant(dulcePecado, 6, CUISINE_CONCEPTS.get(5), 2, 11);

        // 7. Fuego & Carbón BBQ (Provenza, Medellín) -> 1 original + 11 complementarios = 12 cupones
        RestaurantProfile fuegoCarbon = createOrGetRestaurant(
                "restaurante7@cupon.com",
                "Resto123*",
                "Juan Pablo",
                "Montoya",
                "Fuego & Carbón BBQ",
                "Hamburguesas & Parrilla",
                "Cortes de carne premium ahumados a fuego lento estilo Texas BBQ: brisket, ribs bañadas en miel de maple y alitas.",
                "Calle 8 # 42-15, Provenza, Medellín",
                6.2082,
                -75.5656,
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
        seedPromotionsForRestaurant(fuegoCarbon, 7, CUISINE_CONCEPTS.get(0), 1, 12);

        // 8. La Cervecería Capital (Laureles, Medellín) -> 1 original + 8 complementarios = 9 cupones
        RestaurantProfile cerveceria = createOrGetRestaurant(
                "restaurante8@cupon.com",
                "Resto123*",
                "Andrés",
                "Morales",
                "La Cervecería Capital",
                "Gastrobar & Cervecería Artesanal",
                "Pub cervecero con más de 12 líneas de cerveza artesanal en barril, hamburguesas smash y picadas para compartir.",
                "Circular 4 # 73-12, Laureles, Medellín",
                6.2451,
                -75.5917,
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
        seedPromotionsForRestaurant(cerveceria, 8, CUISINE_CONCEPTS.get(7), 1, 9);

        // =========================================================================
        // 9..300: RESTAURANTES REALISTAS ADICIONALES (TOTAL 300 APROBADOS)
        //         Cada uno con entre 9 y 12 cupones con distintos motivos
        // =========================================================================
        for (int i = 9; i <= TOTAL_APPROVED_RESTAURANTS; i++) {
            CuisineConcept concept = CUISINE_CONCEPTS.get((i - 1) % CUISINE_CONCEPTS.size());
            CityZone cityZone = CITY_ZONES.get((i - 1) % CITY_ZONES.size());

            String prefix = concept.brandPrefixes()[(i / CUISINE_CONCEPTS.size()) % concept.brandPrefixes().length].trim();
            String suffix = concept.brandSuffixes()[(i * 3) % concept.brandSuffixes().length].trim();
            String businessName = prefix + " " + suffix + " · " + cityZone.zone();

            String ownerFirst = OWNER_FIRST_NAMES[i % OWNER_FIRST_NAMES.length];
            String ownerLast = OWNER_LAST_NAMES[(i * 5) % OWNER_LAST_NAMES.length];
            String description = concept.descriptions()[i % concept.descriptions().length];
            String logoUrl = concept.logos()[i % concept.logos().length];

            int streetNumber = 10 + (i % 85);
            int houseNumber = 11 + ((i * 7) % 80);
            String address = String.format("%s # %d-%d, %s, %s",
                    cityZone.streetPrefix(), streetNumber, houseNumber, cityZone.zone(), cityZone.city());

            double latOffset = (((i * 17) % 40) - 20) * 0.00045;
            double lngOffset = (((i * 23) % 40) - 20) * 0.00045;
            double lat = Math.round((cityZone.baseLat() + latOffset) * 1000000.0) / 1000000.0;
            double lng = Math.round((cityZone.baseLng() + lngOffset) * 1000000.0) / 1000000.0;

            String phone = String.format("+57 3%02d %03d %04d",
                    10 + (i % 15), 200 + (i % 700), 1000 + ((i * 37) % 8999));

            RestaurantProfile restaurant = createOrGetRestaurant(
                    "restaurante" + i + "@cupon.com",
                    "Resto123*",
                    ownerFirst,
                    ownerLast,
                    businessName,
                    concept.cuisineType(),
                    description,
                    address,
                    lat,
                    lng,
                    phone,
                    logoUrl,
                    ApprovalStatus.APPROVED
            );

            // Entre 9 y 12 cupones por restaurante (9, 10, 11 o 12)
            int couponCount = 9 + (i % 4);
            seedPromotionsForRestaurant(restaurant, i, concept, 0, couponCount);
        }
    }

    private void seedPromotionsForRestaurant(RestaurantProfile restaurant, int restaurantIndex,
                                             CuisineConcept concept, int startMotiveIdx, int totalCouponsTarget) {
        for (int m = startMotiveIdx; m < totalCouponsTarget; m++) {
            PromoMotiveTemplate motive = PROMO_MOTIVES.get(m % PROMO_MOTIVES.size());
            String code = String.format("R%03d-%s-%02d", restaurantIndex, motive.codePrefix(), m + 1);
            if (promotionRepository.existsByCode(code)) {
                continue;
            }

            String dish = concept.signatureDishes()[(restaurantIndex + m) % concept.signatureDishes().length];
            String title = String.format(motive.titleTemplate(), dish);
            String description = String.format(motive.descriptionTemplate(), dish, restaurant.getBusinessName());
            String imageUrl = concept.promoImages()[(restaurantIndex + m) % concept.promoImages().length];

            Set<Category> categories = new HashSet<>();
            Category primaryCat = getCategoryCached(concept.categoryName());
            if (primaryCat != null) {
                categories.add(primaryCat);
            }
            if (m % 2 == 0) {
                Category secondaryCat = getCategoryCached(concept.secondaryCategory());
                if (secondaryCat != null) {
                    categories.add(secondaryCat);
                }
            }

            int maxRedemptions = 60 + ((restaurantIndex + m * 11) % 140);
            int currentRedemptions = (restaurantIndex * 3 + m * 7) % Math.max(15, maxRedemptions / 2);
            long viewCount = currentRedemptions * 4L + ((restaurantIndex * 13L + m * 19L) % 180L);

            // ~92% activas y ~8% deshabilitadas para probar todos los filtros
            PromotionStatus status = ((restaurantIndex + m) % 11 == 0 && m >= 8)
                    ? PromotionStatus.DISABLED
                    : PromotionStatus.ACTIVE;

            Promotion.PromotionBuilder builder = Promotion.builder()
                    .restaurantProfile(restaurant)
                    .code(code)
                    .title(title)
                    .description(description)
                    .discountType(motive.discountType())
                    .discountValue(motive.discountValue())
                    .minPurchase(motive.minPurchase())
                    .startDate(LocalDateTime.now().minusDays(3 + (m % 10)))
                    .endDate(LocalDateTime.now().plusDays(35 + ((restaurantIndex + m * 5) % 60)))
                    .startTime(motive.startTime())
                    .endTime(motive.endTime())
                    .maxRedemptions(maxRedemptions)
                    .currentRedemptions(currentRedemptions)
                    .viewCount(viewCount)
                    .status(status)
                    .imageUrl(imageUrl)
                    .categories(categories)
                    .daysOfWeek(new HashSet<>(motive.daysOfWeek()));

            if (motive.dynamicPricing()) {
                builder.dynamicPricingEnabled(true)
                        .stage1MaxRedemptions(motive.stage1Limit())
                        .stage1DiscountValue(motive.stage1Value())
                        .stage2DiscountValue(motive.stage2Value());
            }

            promotionRepository.save(builder.build());
        }
    }

    private void seedPendingRestaurants() {
        // 1..3: Pendientes originales conservados intactos
        createOrGetRestaurant(
                "pendiente1@cupon.com",
                "Resto123*",
                "Lucía",
                "Vargas",
                "Arepas de la Esquina",
                "Típica Colombiana",
                "Arepas de choclo y maíz blanco rellenas con queso doble crema, carne desmechada y hogao tradicional.",
                "Carrera 15 # 82-10, Bogotá",
                4.6675,
                -74.0548,
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
                "Repostería & Café de Especialidad",
                "Waffles belgas crujientes con toppings ilimitados, helado artesanal y malteadas de la casa.",
                "Carrera 43A # 1-50, Medellín",
                6.2015,
                -75.5712,
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
                "Repostería & Café de Especialidad",
                "Donas glaseadas recién horneadas con rellenos gourmet: arequipe, nutella, frutos rojos y maracuyá.",
                "Avenida 6 Norte # 24N, Cali",
                3.4612,
                -76.5318,
                "+57 311 456 2345",
                "https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?w=400&h=250&fit=crop",
                ApprovalStatus.PENDING
        );

        // 4..12: 9 restaurantes pendientes adicionales (total 12 pendientes por aprobar)
        createOrGetRestaurant(
                "pendiente4@cupon.com",
                "Resto123*",
                "Martín",
                "Echeverri",
                "Asados & Leña El Retiro",
                "Hamburguesas & Parrilla",
                "Punta de anca, chicharrón carnudo al barril, chorizo santarrosano y arepas de mote hechas en fogón de leña.",
                "Calle 10A # 36-18, El Poblado, Medellín",
                6.2089,
                -75.5664,
                "+57 312 654 3210",
                "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop",
                ApprovalStatus.PENDING
        );

        createOrGetRestaurant(
                "pendiente5@cupon.com",
                "Resto123*",
                "Daniela",
                "Sarmiento",
                "Marea Brava Cevichería",
                "Cevichera & Mariscos",
                "Ceviches de corvina y camarón tigre, arroz caldoso marinero y patacones pisados con suero costeño.",
                "Calle 70 # 5-42, Zona G, Bogotá",
                4.6524,
                -74.0541,
                "+57 317 890 1122",
                "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=250&fit=crop",
                ApprovalStatus.PENDING
        );

        createOrGetRestaurant(
                "pendiente6@cupon.com",
                "Resto123*",
                "Nicolás",
                "Arboleda",
                "Kitsune Ramen & Bao House",
                "Japonesa & Nikkei",
                "Caldos ramen cocinados por 18 horas, baos de panceta glaseada en hoisin y entradas japonesas callejeras.",
                "Avenida 9 Norte # 15AN-28, Granada, Cali",
                3.4594,
                -76.5339,
                "+57 318 222 4455",
                "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=250&fit=crop",
                ApprovalStatus.PENDING
        );

        createOrGetRestaurant(
                "pendiente7@cupon.com",
                "Resto123*",
                "Juliana",
                "Puccini",
                "San Marco Pizza Napoletana",
                "Italiana & Pizzería",
                "Masa madre de 72 horas de maduración, tomate San Marzano DOP, fior di latte fresca y albahaca orgánica.",
                "Carrera 52 # 79-40, Alto Prado, Barranquilla",
                11.0024,
                -74.8021,
                "+57 300 411 7788",
                "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=250&fit=crop",
                ApprovalStatus.PENDING
        );

        createOrGetRestaurant(
                "pendiente8@cupon.com",
                "Resto123*",
                "Esteban",
                "Villamizar",
                "La Lupita Mezcalería & Tacos",
                "Cocina Mexicana",
                "Tacos de cochinita pibil, costras de queso al comal, esquites cremosos y cata de mezcales artesanales.",
                "Carrera 35 # 48-22, Cabecera, Bucaramanga",
                7.1187,
                -73.1098,
                "+57 316 543 9988",
                "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=250&fit=crop",
                ApprovalStatus.PENDING
        );

        createOrGetRestaurant(
                "pendiente9@cupon.com",
                "Resto123*",
                "Catalina",
                "Gaviria",
                "Selva Verde Açai & Bowls",
                "Saludable & Poke Bowls",
                "Bowls de açai amazónico puro, mantequilla de almendras artesanal, granola horneada y bowls salados.",
                "Circular 3 # 71-19, Laureles, Medellín",
                6.2446,
                -75.5912,
                "+57 310 765 4321",
                "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop",
                ApprovalStatus.PENDING
        );

        createOrGetRestaurant(
                "pendiente10@cupon.com",
                "Resto123*",
                "Gabriel",
                "Del Castillo",
                "Baluarte Taproom & Grill",
                "Gastrobar & Cervecería Artesanal",
                "Terraza colonial con cervezas artesanales locales, hamburguesas de morrillo y coctelería caribeña.",
                "Calle del Arsenal # 10-25, Getsemaní, Cartagena",
                10.4219,
                -75.5453,
                "+57 315 876 5432",
                "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop",
                ApprovalStatus.PENDING
        );

        createOrGetRestaurant(
                "pendiente11@cupon.com",
                "Resto123*",
                "Paula",
                "Castañeda",
                "L'Atelier du Croissant",
                "Repostería & Café de Especialidad",
                "Hojaldres franceses 100% mantequilla, pain au chocolat, quiches salados y café de finca del Quindío.",
                "Avenida Circunvalar # 9-45, Pinares, Pereira",
                4.8091,
                -75.6817,
                "+57 313 333 2211",
                "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=250&fit=crop",
                ApprovalStatus.PENDING
        );

        createOrGetRestaurant(
                "pendiente12@cupon.com",
                "Resto123*",
                "Santiago",
                "Duque",
                "Bastión Smash & Fries",
                "Hamburguesas & Parrilla",
                "Smash burgers de doble costra crocante, queso cheddar americano, salsa secreta ahumada y papas cajún.",
                "Calle 119 # 6A-30, Usaquén, Bogotá",
                4.6958,
                -74.0302,
                "+57 319 654 7890",
                "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=250&fit=crop",
                ApprovalStatus.PENDING
        );
    }

    private RestaurantProfile createOrGetRestaurant(String email, String rawPassword, String firstName,
                                                    String lastName, String businessName, String cuisineType,
                                                    String description, String address, Double latitude,
                                                    Double longitude, String phone, String logoUrl,
                                                    ApprovalStatus status) {
        User user = userRepository.findByEmail(email).orElse(null);
        String defaultHandle = "https://www.instagram.com/"
                + businessName.toLowerCase().replaceAll("[^a-z0-9]", "");

        if (user == null) {
            user = User.builder()
                    .email(email)
                    .password(encodePasswordCached(rawPassword))
                    .firstName(firstName)
                    .lastName(lastName)
                    .role(Role.ROLE_RESTAURANTE)
                    .enabled(true)
                    .build();
            user = userRepository.save(user);

            RestaurantProfile profile = RestaurantProfile.builder()
                    .user(user)
                    .businessName(businessName)
                    .cuisineType(cuisineType)
                    .description(description)
                    .address(address)
                    .latitude(latitude)
                    .longitude(longitude)
                    .phoneNumber(phone)
                    .instagramUrl(defaultHandle)
                    .logoUrl(logoUrl)
                    .approvalStatus(status)
                    .build();
            return restaurantProfileRepository.save(profile);
        } else {
            user.setPassword(encodePasswordCached(rawPassword));
            user.setEnabled(true);
            userRepository.save(user);

            final User existingUser = user;
            return restaurantProfileRepository.findByUserId(user.getId())
                    .map(existingProfile -> {
                        boolean updated = false;
                        if (existingProfile.getInstagramUrl() == null || existingProfile.getInstagramUrl().isBlank()) {
                            existingProfile.setInstagramUrl(defaultHandle);
                            updated = true;
                        }
                        if (existingProfile.getCuisineType() == null || existingProfile.getCuisineType().isBlank()) {
                            existingProfile.setCuisineType(cuisineType);
                            updated = true;
                        }
                        if (existingProfile.getLatitude() == null || existingProfile.getLongitude() == null) {
                            existingProfile.setLatitude(latitude);
                            existingProfile.setLongitude(longitude);
                            updated = true;
                        }
                        return updated ? restaurantProfileRepository.save(existingProfile) : existingProfile;
                    })
                    .orElseGet(() -> {
                        RestaurantProfile profile = RestaurantProfile.builder()
                                .user(existingUser)
                                .businessName(businessName)
                                .cuisineType(cuisineType)
                                .description(description)
                                .address(address)
                                .latitude(latitude)
                                .longitude(longitude)
                                .phoneNumber(phone)
                                .instagramUrl(defaultHandle)
                                .logoUrl(logoUrl)
                                .approvalStatus(status)
                                .build();
                        return restaurantProfileRepository.save(profile);
                    });
        }
    }

    private void syncExistingRestaurantUser(String email, String rawPassword) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setPassword(encodePasswordCached(rawPassword));
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
            Category cat = getCategoryCached(catName);
            if (cat != null) {
                categories.add(cat);
            }
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
                .currentRedemptions(18)
                .viewCount(95)
                .status(PromotionStatus.ACTIVE)
                .imageUrl(imageUrl)
                .categories(categories)
                .daysOfWeek(new HashSet<>(daysOfWeek))
                .build();

        promotionRepository.save(promo);
    }
}
