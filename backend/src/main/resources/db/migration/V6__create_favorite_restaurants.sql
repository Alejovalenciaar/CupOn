-- =====================================================
-- V6: Restaurantes favoritos de los clientes (HU23)
-- =====================================================

CREATE TABLE favorite_restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_profile_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, restaurant_profile_id)
);

CREATE INDEX idx_favorite_restaurants_user ON favorite_restaurants(user_id);
CREATE INDEX idx_favorite_restaurants_restaurant ON favorite_restaurants(restaurant_profile_id);

