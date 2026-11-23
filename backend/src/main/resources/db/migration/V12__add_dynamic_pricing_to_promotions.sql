-- =====================================================
-- V12: Soporte para Precios Dinámicos Escalonados (Asesor Simplex)
-- =====================================================

ALTER TABLE promotions
ADD COLUMN IF NOT EXISTS dynamic_pricing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stage1_max_redemptions INTEGER,
ADD COLUMN IF NOT EXISTS stage1_discount_value NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS stage2_discount_value NUMERIC(10, 2);
