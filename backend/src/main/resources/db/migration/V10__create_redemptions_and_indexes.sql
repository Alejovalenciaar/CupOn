-- =====================================================
-- V10: Historial de canjes con validación en caja + índices de rendimiento
-- =====================================================

CREATE TABLE redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    verification_code VARCHAR(16) NOT NULL UNIQUE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_redemptions_promotion_id ON redemptions(promotion_id);
CREATE INDEX idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX idx_redemptions_verification_code ON redemptions(verification_code);

-- Índices para acelerar catálogo, métricas y job de expiración
CREATE INDEX IF NOT EXISTS idx_promotions_status_restaurant ON promotions(status, restaurant_profile_id);
CREATE INDEX IF NOT EXISTS idx_promotions_end_date ON promotions(end_date);
