-- =====================================================
-- V6: Contador de vistas del detalle de una promoción
-- =====================================================

ALTER TABLE promotions
    ADD COLUMN view_count BIGINT NOT NULL DEFAULT 0;
