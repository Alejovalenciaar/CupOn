-- V5: Agregar tipo de cocina a los restaurantes para búsqueda por categoría (HU22)
ALTER TABLE restaurant_profiles
ADD COLUMN cuisine_type VARCHAR(100);

-- Índice para optimizar búsquedas por tipo de cocina
CREATE INDEX idx_restaurant_profiles_cuisine_type ON restaurant_profiles (cuisine_type);