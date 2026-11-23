package com.cupon.modules.promotion.service;

import com.cupon.modules.promotion.dto.PricingOptimizationRequest;
import com.cupon.modules.promotion.dto.PricingOptimizationResponse;
import com.cupon.modules.promotion.dto.PricingOptimizationResponse.FeasibleVertex;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Cliente HTTP hacia el microservicio de optimización en Python (FastAPI +
 * SciPy Simplex),
 * con resolución exacta de respaldo (Simplex 2D / evaluación de vértices
 * básicos factibles)
 * cuando el microservicio de Python no está levantado en desarrollo local.
 */
@Component
public class PricingOptimizationClient {

    private static final Logger log = LoggerFactory.getLogger(PricingOptimizationClient.class);

    private final RestClient restClient;

    public PricingOptimizationClient(
            @Value("${app.optimizer.url:http://localhost:8000}") String optimizerBaseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(optimizerBaseUrl)
                .build();
    }

    public PricingOptimizationResponse optimize(PricingOptimizationRequest request) {
        validateDomain(request);

        try {
            PricingOptimizationResponse remoteResponse = restClient.post()
                    .uri("/optimize")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(PricingOptimizationResponse.class);
            if (remoteResponse != null) {
                return remoteResponse;
            }
        } catch (Exception ex) {
            log.debug("Microservicio Python optimizer no disponible ({}). Ejecutando motor Simplex 2D integrado.",
                    ex.getMessage());
        }

        return solveSimplex2D(request);
    }

    public static void validateDomain(PricingOptimizationRequest req) {
        double P = req.regularPrice();
        double C = req.unitCost();
        double p1 = req.discountStage1();
        double p2 = req.discountStage2();
        double K = req.maxCapacity();
        double D1 = req.maxDemandStage1();
        double B = req.maxDiscountBudget();

        if (P <= 0) {
            throw new IllegalArgumentException("El precio regular (P) debe ser mayor que 0.");
        }
        if (C <= 0 || C >= P) {
            throw new IllegalArgumentException(
                    "El costo directo unitario (C) debe ser mayor que 0 y menor que el precio regular (P).");
        }
        if (p1 <= 0 || p2 <= p1 || p2 >= 1) {
            throw new IllegalArgumentException(
                    "Los porcentajes de descuento deben cumplir 0 < p1 < p2 < 1 (ej. 10% en Etapa Normal y 25% en Última Hora).");
        }
        if (K <= 0) {
            throw new IllegalArgumentException("La capacidad máxima (K) debe ser mayor que 0.");
        }
        if (D1 < 0 || D1 > K) {
            throw new IllegalArgumentException(
                    "La demanda máxima en Etapa Normal (D1) debe estar entre 0 y la capacidad máxima (K).");
        }
        if (B <= 0) {
            throw new IllegalArgumentException("El presupuesto máximo de descuento (B) debe ser mayor que 0.");
        }

        double u2 = P * (1.0 - p2) - C;
        if (u2 <= 0) {
            double maxRentablePct = ((P - C) / P) * 100.0;
            throw new IllegalArgumentException(String.format(
                    "El descuento de última hora (%.0f%%) genera pérdida o utilidad nula (u2 = $%,.0f). El descuento máximo rentable es %.1f%%.",
                    p2 * 100.0, u2, maxRentablePct));
        }
    }

    public static PricingOptimizationResponse solveSimplex2D(PricingOptimizationRequest req) {
        double P = req.regularPrice();
        double C = req.unitCost();
        double p1 = req.discountStage1();
        double p2 = req.discountStage2();
        double K = req.maxCapacity();
        double D1 = req.maxDemandStage1();
        double B = req.maxDiscountBudget();

        double d1 = P * p1;
        double d2 = P * p2;
        double u1 = P * (1.0 - p1) - C;
        double u2 = P * (1.0 - p2) - C;

        List<double[]> candidates = new ArrayList<>();
        candidates.add(new double[] { 0.0, 0.0 });
        candidates.add(new double[] { 0.0, K });
        candidates.add(new double[] { 0.0, B / d2 });
        candidates.add(new double[] { D1, 0.0 });
        candidates.add(new double[] { K, 0.0 });
        candidates.add(new double[] { B / d1, 0.0 });
        candidates.add(new double[] { D1, K - D1 });
        candidates.add(new double[] { D1, (B - d1 * D1) / d2 });

        if (Math.abs(d2 - d1) > 1e-9) {
            double xInt = (d2 * K - B) / (d2 - d1);
            double yInt = K - xInt;
            candidates.add(new double[] { xInt, yInt });
        }

        double eps = 1e-6;
        List<double[]> feasible = new ArrayList<>();
        for (double[] pt : candidates) {
            double x = pt[0];
            double y = pt[1];
            if (x >= -eps
                    && y >= -eps
                    && (x + y) <= K + eps
                    && x <= D1 + eps
                    && (d1 * x + d2 * y) <= B + eps) {
                double rx = Math.max(0.0, round2(x));
                double ry = Math.max(0.0, round2(y));
                boolean exists = feasible.stream()
                        .anyMatch(ex -> Math.abs(ex[0] - rx) < 1e-3 && Math.abs(ex[1] - ry) < 1e-3);
                if (!exists) {
                    feasible.add(new double[] { rx, ry });
                }
            }
        }

        if (feasible.size() > 2) {
            double cx = feasible.stream().mapToDouble(p -> p[0]).average().orElse(0.0);
            double cy = feasible.stream().mapToDouble(p -> p[1]).average().orElse(0.0);
            feasible.sort(Comparator.comparingDouble(p -> Math.atan2(p[1] - cy, p[0] - cx)));
        }

        List<FeasibleVertex> vertices = feasible.stream()
                .map(p -> new FeasibleVertex(p[0], p[1], round2(u1 * p[0] + u2 * p[1])))
                .toList();

        FeasibleVertex best = vertices.stream()
                .max(Comparator.comparingDouble(FeasibleVertex::z)
                        .thenComparingDouble(FeasibleVertex::x)
                        .thenComparingDouble(FeasibleVertex::y))
                .orElse(new FeasibleVertex(0.0, 0.0, 0.0));

        double xOpt = best.x();
        double yOpt = best.y();
        double zOpt = best.z();
        double s1 = Math.max(0.0, round2(K - (xOpt + yOpt)));
        double s2 = Math.max(0.0, round2(D1 - xOpt));
        double s3 = Math.max(0.0, round2(B - (d1 * xOpt + d2 * yOpt)));

        return new PricingOptimizationResponse(
                xOpt,
                yOpt,
                round2(xOpt + yOpt),
                zOpt,
                round2(u1),
                round2(u2),
                round2(d1),
                round2(d2),
                s1,
                s2,
                s3,
                vertices);
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
