-- =====================================================
-- V11: Agregar Instagram / redes sociales al perfil del restaurante
-- =====================================================

ALTER TABLE restaurant_profiles
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500);
