-- =====================================================
-- V1: Esquema inicial de la plataforma Cupon
-- =====================================================

-- USERS: Tabla central de identidad
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'ROLE_CLIENTE',
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CLIENT PROFILES: Datos específicos del cliente
CREATE TABLE client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RESTAURANT PROFILES: Datos del restaurante con flujo de aprobación
CREATE TABLE restaurant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    description TEXT,
    address VARCHAR(500),
    logo_url VARCHAR(500),
    phone_number VARCHAR(20),
    approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CATEGORIES: Categorías de promociones
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    icon_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROMOTIONS: Promociones publicadas por restaurantes
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_profile_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    code VARCHAR(50) UNIQUE,
    discount_type VARCHAR(20) NOT NULL,
    discount_value NUMERIC(10,2) NOT NULL,
    min_purchase NUMERIC(10,2) DEFAULT 0,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    max_redemptions INT DEFAULT 0,
    current_redemptions INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROMOTION_CATEGORIES: Relación many-to-many
CREATE TABLE promotion_categories (
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (promotion_id, category_id)
);

-- FAVORITES: Promociones favoritas de los clientes
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, promotion_id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_restaurant_profiles_user ON restaurant_profiles(user_id);
CREATE INDEX idx_restaurant_profiles_approval ON restaurant_profiles(approval_status);
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_restaurant ON promotions(restaurant_profile_id);
CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_promotion ON favorites(promotion_id);

-- =====================================================
-- SEED: Categorías iniciales
-- =====================================================
INSERT INTO categories (name, description) VALUES
    ('Comida Rápida', 'Hamburguesas, pizzas, hotdogs y más'),
    ('Comida Mexicana', 'Tacos, burritos, enchiladas y platillos típicos'),
    ('Sushi', 'Sushi, rolls y comida japonesa'),
    ('Postres', 'Pasteles, helados, dulces y repostería'),
    ('Bebidas', 'Cafés, jugos, smoothies y cócteles'),
    ('Comida Saludable', 'Ensaladas, bowls y opciones fitness'),
    ('Italiana', 'Pastas, pizzas artesanales y risottos'),
    ('Mariscos', 'Ceviches, cócteles de camarón y pescados');
