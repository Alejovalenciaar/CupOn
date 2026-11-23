package com.cupon.modules.promotion.dto;

import java.util.List;

/**
 * Resultado óptimo del modelo de Programación Lineal (Método Simplex Básico y Método Gráfico)
 * para la asignación de cupones entre Etapa Normal (x*) y Etapa de Última Hora (y*).
 */
public record PricingOptimizationResponse(
        double xOpt,
        double yOpt,
        double totalCoupons,
        double maxProfit,
        double u1,
        double u2,
        double d1,
        double d2,
        double s1UnusedCapacity,
        double s2UnmetDemandStage1,
        double s3RemainingBudget,
        List<FeasibleVertex> vertices
) {
    public record FeasibleVertex(
            double x,
            double y,
            double z
    ) {
    }
}
