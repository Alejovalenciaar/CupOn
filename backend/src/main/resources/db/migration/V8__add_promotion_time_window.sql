-- =====================================================
-- V8: Franja horaria diaria en que aplica una promoción
-- =====================================================

-- Ambas columnas son opcionales: NULL en las dos significa que la promoción
-- aplica todo el día. Si se define una, debe definirse la otra.
ALTER TABLE promotions
    ADD COLUMN start_time TIME,
    ADD COLUMN end_time TIME;

ALTER TABLE promotions
    ADD CONSTRAINT chk_promotions_time_window
        CHECK (
            (start_time IS NULL AND end_time IS NULL)
            OR (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
        );
