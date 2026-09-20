-- =====================================================
-- V3: Días de la semana en que aplica una promoción
-- =====================================================

CREATE TABLE promotion_days (
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    PRIMARY KEY (promotion_id, day_of_week)
);

CREATE INDEX idx_promotion_days_day ON promotion_days(day_of_week);
