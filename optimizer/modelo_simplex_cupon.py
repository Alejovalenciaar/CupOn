"""
Variables de decisión:
    x : Cantidad de cupones asignados a la Etapa Normal (descuento p1)
    y : Cantidad de cupones asignados a la Etapa de Última Hora (descuento p2)

Función Objetivo:
    Maximizar Z = u1 * x + u2 * y

Restricciones (Simplex Básico — todas <=):
    R1 (Capacidad):         x + y <= K
    R2 (Demanda Etapa 1):   x <= D1
    R3 (Presupuesto dcto):  d1 * x + d2 * y <= B
    R4 (No negatividad):    x >= 0, y >= 0
"""

import math
from typing import Any, Dict, List, Optional


def calcular_vertices_factibles(
    K: float, D1: float, B: float, d1: float, d2: float, u1: float, u2: float
) -> List[Dict[str, float]]:
    """
    Calcula los vértices del polígono de la región factible en 2D para el Método Gráfico.
    Ordenados angularmente alrededor de su centroide para facilitar su trazado.
    """
    candidatos = [
        (0.0, 0.0),
        (0.0, K),
        (0.0, B / d2),
        (D1, 0.0),
        (K, 0.0),
        (B / d1, 0.0),
        # Intersección R1 (x + y = K) con R2 (x = D1)
        (D1, K - D1),
        # Intersección R3 (d1*x + d2*y = B) con R2 (x = D1)
        (D1, (B - d1 * D1) / d2),
    ]

    # Intersección R1 (x + y = K) con R3 (d1*x + d2*y = B)
    if abs(d2 - d1) > 1e-9:
        x_r1_r3 = (d2 * K - B) / (d2 - d1)
        y_r1_r3 = K - x_r1_r3
        candidatos.append((x_r1_r3, y_r1_r3))

    eps = 1e-6
    factibles: List[tuple[float, float]] = []
    for x_c, y_c in candidatos:
        if (
            x_c >= -eps
            and y_c >= -eps
            and (x_c + y_c) <= K + eps
            and x_c <= D1 + eps
            and (d1 * x_c + d2 * y_c) <= B + eps
        ):
            pt = (max(0.0, round(float(x_c), 4)), max(0.0, round(float(y_c), 4)))
            if not any(abs(pt[0] - ex[0]) < 1e-3 and abs(pt[1] - ex[1]) < 1e-3 for ex in factibles):
                factibles.append(pt)

    if len(factibles) > 2:
        cx = sum(p[0] for p in factibles) / len(factibles)
        cy = sum(p[1] for p in factibles) / len(factibles)
        factibles.sort(key=lambda p: math.atan2(p[1] - cy, p[0] - cx))

    return [
        {
            "x": round(px, 2),
            "y": round(py, 2),
            "z": round(u1 * px + u2 * py, 2),
        }
        for px, py in factibles
    ]


def calcular_modelo_simplex(
    P: float,
    C: float,
    p1: float,
    p2: float,
    K: float,
    D1: float,
    B: float,
) -> Dict[str, Any]:
    """
    Resuelve el modelo de programación lineal con SciPy (Simplex / HiGHS)
    —con respaldo exacto por Teorema Fundamental de la Programación Lineal (evaluación de vértices
    básicos factibles) si SciPy no está instalado en el entorno local—.
    """
    if P <= 0:
        raise ValueError("El precio regular P debe ser mayor que 0.")
    if not (0 < C < P):
        raise ValueError("El costo unitario C debe ser mayor que 0 y menor que el precio regular P.")
    if not (0 < p1 < p2 < 1):
        raise ValueError("Los porcentajes de descuento deben cumplir 0 < p1 < p2 < 1 (ej. 0.10 y 0.25).")
    if K <= 0:
        raise ValueError("La capacidad máxima K debe ser mayor que 0.")
    if not (0 <= D1 <= K):
        raise ValueError("La demanda máxima en Etapa Normal (D1) debe estar entre 0 y K.")
    if B <= 0:
        raise ValueError("El presupuesto máximo de descuento B debe ser mayor que 0.")

    d1 = P * p1
    d2 = P * p2
    u1 = P * (1 - p1) - C
    u2 = P * (1 - p2) - C

    if u2 <= 0:
        raise ValueError(
            f"El descuento de última hora ({p2*100:.0f}%) genera pérdida o utilidad nula (u2 = {u2:,.0f}). "
            f"El descuento máximo rentable es {((P - C) / P) * 100:.1f}%."
        )

    vertices = calcular_vertices_factibles(K, D1, B, d1, d2, u1, u2)
    raw_res = None

    try:
        from scipy.optimize import linprog

        # linprog minimiza c^T * [x, y], por eso multiplicamos por -1 para maximizar Z
        c = [-u1, -u2]
        A_ub = [
            [1.0, 1.0],  # R1: x + y <= K
            [1.0, 0.0],  # R2: x <= D1
            [d1, d2],    # R3: d1*x + d2*y <= B
        ]
        b_ub = [K, D1, B]
        bounds = [(0, None), (0, None)]  # R4: x >= 0, y >= 0

        res = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method="highs")
        if not res.success:
            raise ValueError(f"No se encontró solución óptima factible: {res.message}")

        x_opt, y_opt = float(res.x[0]), float(res.x[1])
        z_opt = float(-res.fun)
        s1, s2, s3 = float(res.slack[0]), float(res.slack[1]), float(res.slack[2])
        raw_res = res
    except ImportError:
        # Respaldo exacto por evaluación de soluciones básicas factibles (vértices del Simplex)
        if not vertices:
            raise ValueError("La región factible es vacía.")
        best = max(vertices, key=lambda v: (v["z"], v["x"], v["y"]))
        x_opt, y_opt, z_opt = best["x"], best["y"], best["z"]
        s1 = max(0.0, K - (x_opt + y_opt))
        s2 = max(0.0, D1 - x_opt)
        s3 = max(0.0, B - (d1 * x_opt + d2 * y_opt))

    return {
        "xOpt": round(x_opt, 2),
        "yOpt": round(y_opt, 2),
        "totalCoupons": round(x_opt + y_opt, 2),
        "maxProfit": round(z_opt, 2),
        "u1": round(u1, 2),
        "u2": round(u2, 2),
        "d1": round(d1, 2),
        "d2": round(d2, 2),
        "s1UnusedCapacity": round(s1, 2),
        "s2UnmetDemandStage1": round(s2, 2),
        "s3RemainingBudget": round(s3, 2),
        "vertices": vertices,
        "rawResult": raw_res,
    }


def resolver_precio_dinamico_cupon(
    P: float,
    C: float,
    p1: float,
    p2: float,
    K: float,
    D1: float,
    B: float,
    graficar: bool = True,
    guardar_grafico: Optional[str] = "region_factible_cupon.png",
):
    """Resuelve el modelo de precios dinámicos escalonados, imprime el reporte y grafica la región factible."""
    resultado = calcular_modelo_simplex(P=P, C=C, p1=p1, p2=p2, K=K, D1=D1, B=B)
    res = resultado["rawResult"]

    d1, d2 = resultado["d1"], resultado["d2"]
    u1, u2 = resultado["u1"], resultado["u2"]
    x_opt, y_opt = resultado["xOpt"], resultado["yOpt"]
    z_opt = resultado["maxProfit"]
    s1 = resultado["s1UnusedCapacity"]
    s2 = resultado["s2UnmetDemandStage1"]
    s3 = resultado["s3RemainingBudget"]

    # Reporte en consola
    print("=" * 65)
    print("  RESULTADOS DEL MODELO — PRECIOS DINÁMICOS EN CUPON")
    print("=" * 65)
    print(f"Parámetros del plato : P = ${P:,.0f} | C = ${C:,.0f}")
    print(f"Descuentos por etapa : p1 = {p1*100:.0f}% (d1 = ${d1:,.0f}) | p2 = {p2*100:.0f}% (d2 = ${d2:,.0f})")
    print(f"Utilidad unitaria    : u1 = ${u1:,.0f} | u2 = ${u2:,.0f}")
    print("-" * 65)
    print(f"Función Objetivo     : Max Z = {u1:,.0f}x + {u2:,.0f}y")
    print(f"R1 (Capacidad)       : x + y <= {K:,.0f}")
    print(f"R2 (Demanda Etapa 1) : x <= {D1:,.0f}")
    print(f"R3 (Presupuesto)     : {d1:,.0f}x + {d2:,.0f}y <= {B:,.0f}")
    print("-" * 65)
    print("SOLUCIÓN ÓPTIMA:")
    print(f"  x* (Etapa Normal)      = {x_opt:,.2f} cupones")
    print(f"  y* (Etapa Última Hora) = {y_opt:,.2f} cupones")
    print(f"  Total cupones emitidos = {x_opt + y_opt:,.2f} de {K:,.0f} disponibles")
    print(f"  Utilidad Máxima (Z*)   = ${z_opt:,.0f} COP")
    print("-" * 65)
    print("VARIABLES DE HOLGURA (Simplex Básico):")
    print(f"  s1 (Capacidad no usada)     = {s1:,.2f} platos")
    print(f"  s2 (Demanda no cubierta)    = {s2:,.2f} cupones")
    print(f"  s3 (Presupuesto sobrante)   = ${s3:,.0f} COP")
    print("=" * 65)

    # Método Gráfico (2D)
    if graficar:
        import numpy as np
        import matplotlib.pyplot as plt

        x_max = max(K, D1, B / d1) * 1.1
        y_max = max(K, B / d2) * 1.15
        x_vals = np.linspace(0, x_max, 500)

        y_r1 = K - x_vals
        y_r3 = (B - d1 * x_vals) / d2
        y_iso = (z_opt - u1 * x_vals) / u2

        x_feas = np.linspace(0, min(D1, K, B / d1), 400)
        y_upper = np.minimum(K - x_feas, (B - d1 * x_feas) / d2)
        y_upper = np.maximum(0, y_upper)

        fig, ax = plt.subplots(figsize=(8.2, 5.2), dpi=150)

        ax.plot(x_vals, y_r1, label=f"R1: Capacidad (x + y ≤ {K:.0f})", color="#64748B", linestyle="--", lw=1.8)
        ax.axvline(D1, label=f"R2: Demanda Etapa 1 (x ≤ {D1:.0f})", color="#1B365D", lw=2.0)
        ax.plot(
            x_vals,
            y_r3,
            label=f"R3: Presupuesto dcto. ({d1/1000:.0f}x + {d2/1000:.0f}y ≤ {B/1000:.0f} mil)",
            color="#0D7377",
            lw=2.2,
        )
        ax.plot(x_vals, y_iso, label=f"Recta Isoutilidad (Z* = ${z_opt:,.0f})", color="#DC2626", linestyle=":", lw=2.0)

        ax.fill_between(x_feas, 0, y_upper, color="#0D7377", alpha=0.20, label="Región Factible")

        ax.scatter(x_opt, y_opt, color="#DC2626", s=95, zorder=6, edgecolors="white", linewidth=1.4)
        ax.annotate(
            f"ÓPTIMO ({x_opt:.0f}, {y_opt:.0f})\nZ* = ${z_opt:,.0f} COP",
            xy=(x_opt, y_opt),
            xytext=(x_opt + x_max * 0.07, y_opt + y_max * 0.12),
            fontsize=9.5,
            fontweight="bold",
            color="#B91C1C",
            arrowprops=dict(arrowstyle="->", color="#DC2626", lw=1.5),
            bbox=dict(boxstyle="round,pad=0.35", facecolor="#FEF2F2", edgecolor="#DC2626"),
        )

        ax.set_xlim(0, x_max)
        ax.set_ylim(0, y_max)
        ax.set_xlabel(f"x: Cupones en Etapa Normal ({p1*100:.0f}% descuento)", fontsize=10.5, fontweight="bold", color="#1B365D")
        ax.set_ylabel(f"y: Cupones en Etapa Última Hora ({p2*100:.0f}% descuento)", fontsize=10.5, fontweight="bold", color="#1B365D")
        ax.set_title("Método Gráfico y Solución Simplex — Precios Dinámicos en Cupon", fontsize=11.5, fontweight="bold", color="#1B365D", pad=12)
        ax.grid(True, linestyle="--", alpha=0.35)
        ax.legend(loc="upper right", fontsize=8.5, frameon=True)

        plt.tight_layout()
        if guardar_grafico:
            plt.savefig(guardar_grafico, dpi=300)
            print(f"Gráfico guardado en: {guardar_grafico}")
        plt.show()

    return res if res is not None else resultado


if __name__ == "__main__":
    resolver_precio_dinamico_cupon(
        P=40_000,   # Precio regular del plato (COP)
        C=20_000,   # Costo directo unitario (COP)
        p1=0.10,    # Descuento Etapa Normal (10%)
        p2=0.25,    # Descuento Etapa Última Hora (25%)
        K=120,      # Capacidad máxima semanal (platos/cupones)
        D1=70,      # Demanda máxima estimada en Etapa Normal
        B=680_000,  # Presupuesto máximo de descuento (COP)
        graficar=True,
    )
