"""
Microservicio REST de Optimización de Precios Dinámicos Escalonados para CupOn
Tecnologías: FastAPI + SciPy (scipy.optimize.linprog - Método Simplex / HiGHS)
"""

from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from modelo_simplex_cupon import calcular_modelo_simplex

app = FastAPI(
    title="CupOn Dynamic Pricing Optimizer",
    description="Microservicio de Programación Lineal (Método Simplex Básico) para distribución óptima de cupones en dos etapas.",
    version="1.0.0",
)


class PricingOptimizationPayload(BaseModel):
    regularPrice: float = Field(..., gt=0, description="P: Precio regular de venta del producto o combo (COP)")
    unitCost: float = Field(..., gt=0, description="C: Costo directo unitario de preparación (COP)")
    discountStage1: float = Field(..., gt=0, lt=1, description="p1: Proporción de descuento en Etapa Normal (ej. 0.10 para 10%)")
    discountStage2: float = Field(..., gt=0, lt=1, description="p2: Proporción de descuento en Etapa de Última Hora (ej. 0.25 para 25%)")
    maxCapacity: float = Field(..., gt=0, description="K: Capacidad máxima total de platos/cupones disponibles")
    maxDemandStage1: float = Field(..., ge=0, description="D1: Demanda máxima estimada en Etapa Normal")
    maxDiscountBudget: float = Field(..., gt=0, description="B: Presupuesto máximo autorizado en descuentos (COP)")


class FeasibleVertex(BaseModel):
    x: float
    y: float
    z: float


class PricingOptimizationResult(BaseModel):
    xOpt: float = Field(..., description="x*: Cantidad óptima de cupones en Etapa Normal")
    yOpt: float = Field(..., description="y*: Cantidad óptima de cupones en Etapa de Última Hora")
    totalCoupons: float = Field(..., description="x* + y*: Total de cupones emitidos")
    maxProfit: float = Field(..., description="Z*: Utilidad neta máxima proyectada (COP)")
    u1: float = Field(..., description="u1: Utilidad neta unitaria en Etapa Normal (COP)")
    u2: float = Field(..., description="u2: Utilidad neta unitaria en Etapa de Última Hora (COP)")
    d1: float = Field(..., description="d1: Descuento monetario unitario en Etapa Normal (COP)")
    d2: float = Field(..., description="d2: Descuento monetario unitario en Etapa de Última Hora (COP)")
    s1UnusedCapacity: float = Field(..., description="s1: Variable de holgura de capacidad no utilizada")
    s2UnmetDemandStage1: float = Field(..., description="s2: Variable de holgura de demanda no cubierta en Etapa 1")
    s3RemainingBudget: float = Field(..., description="s3: Variable de holgura de presupuesto de descuento sobrante (COP)")
    vertices: List[FeasibleVertex] = Field(default_factory=list, description="Vértices del polígono de la región factible (Método Gráfico)")


@app.get("/health")
def health_check():
    return {"status": "UP", "service": "cupon-pricing-optimizer"}


@app.post("/optimize", response_model=PricingOptimizationResult)
def optimize_pricing(payload: PricingOptimizationPayload):
    try:
        res = calcular_modelo_simplex(
            P=payload.regularPrice,
            C=payload.unitCost,
            p1=payload.discountStage1,
            p2=payload.discountStage2,
            K=payload.maxCapacity,
            D1=payload.maxDemandStage1,
            B=payload.maxDiscountBudget,
        )
        return PricingOptimizationResult(
            xOpt=res["xOpt"],
            yOpt=res["yOpt"],
            totalCoupons=res["totalCoupons"],
            maxProfit=res["maxProfit"],
            u1=res["u1"],
            u2=res["u2"],
            d1=res["d1"],
            d2=res["d2"],
            s1UnusedCapacity=res["s1UnusedCapacity"],
            s2UnmetDemandStage1=res["s2UnmetDemandStage1"],
            s3RemainingBudget=res["s3RemainingBudget"],
            vertices=res["vertices"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
