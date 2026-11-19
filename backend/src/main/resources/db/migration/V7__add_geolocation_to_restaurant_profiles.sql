-- =====================================================
-- V7: Geolocalización para perfiles de restaurante (HU25)
-- =====================================================

ALTER TABLE restaurant_profiles
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

