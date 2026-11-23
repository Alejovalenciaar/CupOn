package com.cupon.modules.promotion.entity;

import com.cupon.common.entity.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.cupon.modules.user.entity.RestaurantProfile;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "promotions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Promotion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_profile_id", nullable = false)
    private RestaurantProfile restaurantProfile;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "min_purchase", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal minPurchase = BigDecimal.ZERO;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    /** Hora diaria de inicio de la franja. Null junto con endTime = aplica todo el día. */
    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "max_redemptions")
    @Builder.Default
    private int maxRedemptions = 0;

    @Column(name = "current_redemptions")
    @Builder.Default
    private int currentRedemptions = 0;

    /** Veces que se ha consultado el detalle (GET /promotions/{id}). Se incrementa en BD de forma atómica. */
    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private long viewCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PromotionStatus status = PromotionStatus.DRAFT;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    /** Indica si el cupón fue configurado con el Asesor de Precio Dinámico Escalonado (Simplex). */
    @Column(name = "dynamic_pricing_enabled", nullable = false)
    @Builder.Default
    private boolean dynamicPricingEnabled = false;

    /** Meta de canjes en Etapa 1 (x*). Al llegar a este número de canjes, pasa automáticamente a Etapa 2. */
    @Column(name = "stage1_max_redemptions")
    private Integer stage1MaxRedemptions;

    /** Descuento configurado para la Etapa 1 Normal (p1). */
    @Column(name = "stage1_discount_value", precision = 10, scale = 2)
    private BigDecimal stage1DiscountValue;

    /** Descuento configurado para la Etapa 2 Última Hora (p2). */
    @Column(name = "stage2_discount_value", precision = 10, scale = 2)
    private BigDecimal stage2DiscountValue;

    @ManyToMany
    @JoinTable(
            name = "promotion_categories",
            joinColumns = @JoinColumn(name = "promotion_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private Set<Category> categories = new HashSet<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "promotion_days",
            joinColumns = @JoinColumn(name = "promotion_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", length = 20)
    @Builder.Default
    private Set<DayOfWeek> daysOfWeek = new HashSet<>();

    /**
     * Determina si el instante dado cae dentro del período de vigencia (inicio y fin inclusive).
     * Punto único de comparación temporal para no duplicar esta lógica en distintas capas.
     */
    public boolean isWithinSchedule(LocalDateTime reference) {
        return !reference.isBefore(startDate) && !reference.isAfter(endDate);
    }

    public boolean isCurrentlyActive(LocalDateTime reference) {
        return status == PromotionStatus.ACTIVE && isWithinSchedule(reference);
    }

    public boolean isCurrentlyActive() {
        return isCurrentlyActive(LocalDateTime.now());
    }

    /** Sin días configurados la promoción aplica todos los días. */
    public boolean appliesOnDay(DayOfWeek day) {
        return daysOfWeek == null || daysOfWeek.isEmpty() || daysOfWeek.contains(day);
    }

    /** Sin franja configurada (ambas horas nulas) la promoción aplica todo el día. Inicio inclusive, fin exclusive. */
    public boolean isWithinTimeWindow(LocalTime time) {
        if (startTime == null || endTime == null) {
            return true;
        }
        return !time.isBefore(startTime) && time.isBefore(endTime);
    }

    public boolean hasRedemptionsLeft() {
        return maxRedemptions <= 0 || currentRedemptions < maxRedemptions;
    }

    /**
     * Devuelve la etapa actual del precio dinámico:
     * null si no usa precio dinámico, 1 si está en Etapa Normal (currentRedemptions < x*),
     * o 2 si ya alcanzó x* y pasó automáticamente a Etapa de Última Hora.
     */
    public Integer getCurrentDynamicStage() {
        if (!dynamicPricingEnabled) {
            return null;
        }
        if (stage1MaxRedemptions != null
                && stage1MaxRedemptions > 0
                && currentRedemptions >= stage1MaxRedemptions
                && stage2DiscountValue != null) {
            return 2;
        }
        return 1;
    }
}
