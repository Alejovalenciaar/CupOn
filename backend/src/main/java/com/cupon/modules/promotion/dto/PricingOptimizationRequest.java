package com.cupon.modules.promotion.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * Parámetros de entrada para el modelo de Programación Lineal (Método Simplex Básico)
 * de precios dinámicos escalonados en dos etapas.
 */
public record PricingOptimizationRequest(
        @NotNull(message = "El precio regular (P) es obligatorio")
        @Positive(message = "El precio regular (P) debe ser mayor que 0")
        Double regularPrice,

        @NotNull(message = "El costo directo unitario (C) es obligatorio")
        @Positive(message = "El costo directo unitario (C) debe ser mayor que 0")
        Double unitCost,

        @NotNull(message = "El porcentaje de descuento en Etapa Normal (p1) es obligatorio")
        @DecimalMin(value = "0.01", message = "El descuento en Etapa Normal (p1) debe ser al menos 1% (0.01)")
        @DecimalMax(value = "0.99", message = "El descuento en Etapa Normal (p1) debe ser menor al 100% (0.99)")
        Double discountStage1,

        @NotNull(message = "El porcentaje de descuento en Etapa de Última Hora (p2) es obligatorio")
        @DecimalMin(value = "0.01", message = "El descuento en Etapa de Última Hora (p2) debe ser al menos 1% (0.01)")
        @DecimalMax(value = "0.99", message = "El descuento en Etapa de Última Hora (p2) debe ser menor al 100% (0.99)")
        Double discountStage2,

        @NotNull(message = "La capacidad máxima (K) es obligatoria")
        @Positive(message = "La capacidad máxima (K) debe ser mayor que 0")
        Double maxCapacity,

        @NotNull(message = "La demanda máxima estimada en Etapa Normal (D1) es obligatoria")
        @PositiveOrZero(message = "La demanda máxima en Etapa Normal (D1) no puede ser negativa")
        Double maxDemandStage1,

        @NotNull(message = "El presupuesto máximo de descuento (B) es obligatorio")
        @Positive(message = "El presupuesto máximo de descuento (B) debe ser mayor que 0")
        Double maxDiscountBudget
) {
}
