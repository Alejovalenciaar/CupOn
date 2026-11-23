import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { optimizePromotionPricing } from "@/api/promotionServices";
import { IconChart, IconCheckCircle, IconSparkles } from "@/components/Icons";
import type { PricingOptimizationRequest, PricingOptimizationResponse } from "@/types";

interface DynamicPricingOptimizerProps {
  onApplyStage: (config: {
    discountType: "PERCENTAGE";
    discountValue: number;
    maxRedemptions: number;
    stageLabel: string;
    dynamicPricingEnabled: boolean;
    stage1MaxRedemptions: number | null;
    stage1DiscountValue: number | null;
    stage2DiscountValue: number | null;
  }) => void;
}

const inputCls =
  "w-full bg-white border border-surface-border rounded-button px-2.5 py-1.5 text-xs text-content-primary outline-none focus:border-brand-500 shadow-subtle tabular-nums";

export default function DynamicPricingOptimizer({ onApplyStage }: DynamicPricingOptimizerProps) {
  const [enabled, setEnabled] = useState(false);

  // Parámetros del modelo con valores iniciales de ejemplo
  const [regularPrice, setRegularPrice] = useState<number>(40000);
  const [unitCost, setUnitCost] = useState<number>(20000);
  const [discountPct1, setDiscountPct1] = useState<number>(10);
  const [discountPct2, setDiscountPct2] = useState<number>(25);
  const [maxCapacity, setMaxCapacity] = useState<number>(120);
  const [maxDemandStage1, setMaxDemandStage1] = useState<number>(70);
  const [maxDiscountBudget, setMaxDiscountBudget] = useState<number>(680000);
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);

  const mutation = useMutation<PricingOptimizationResponse, any, PricingOptimizationRequest>({
    mutationFn: (payload) => optimizePromotionPricing(payload),
  });

  const handleCalculate = () => {
    setAppliedBanner(null);
    mutation.mutate({
      regularPrice,
      unitCost,
      discountStage1: Number((discountPct1 / 100).toFixed(4)),
      discountStage2: Number((discountPct2 / 100).toFixed(4)),
      maxCapacity,
      maxDemandStage1,
      maxDiscountBudget,
    });
  };

  const result = mutation.data;
  const errorMessage =
    mutation.error?.response?.data?.message ||
    mutation.error?.message ||
    null;

  return (
    <div className="border border-surface-border bg-surface-canvas rounded-card overflow-hidden">
      {/* Cabecera / Switch del Asesor */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 bg-surface-card border-b border-surface-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center shrink-0">
            <IconSparkles size={14} />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-content-primary block truncate">
              Asesor de Precio Dinámico Escalonado
            </span>
            <span className="text-[11px] text-content-secondary block truncate">
              Calcula cuántos cupones ofrecer al inicio y cuántos en última hora sin perder rentabilidad
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const next = !enabled;
            setEnabled(next);
            if (next && !mutation.data && !mutation.isPending) {
              handleCalculate();
            }
          }}
          className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-button border transition-colors ${
            enabled
              ? "bg-content-primary text-white border-content-primary"
              : "bg-white text-brand-700 border-brand-200 hover:bg-brand-50"
          }`}
        >
          {enabled ? "Ocultar asesor" : "Usar asesor"}
        </button>
      </div>

      {enabled && (
        <div className="p-4 space-y-4">
          {/* Guía breve para dueños de restaurantes */}
          <div className="bg-surface-card border border-surface-border rounded-card p-3 space-y-1.5">
            <span className="text-xs font-semibold text-content-primary block">
              ¿Cómo funciona este asesor para tu negocio?
            </span>
            <p className="text-[11px] text-content-secondary leading-relaxed">
              Cuando lanzas una promoción, dar un descuento muy alto desde el primer día reduce tus ganancias, pero dar uno muy bajo puede dejar platos sin vender. Este asesor divide tu campaña en <strong>2 etapas</strong>: una <strong>Etapa 1 (Normal)</strong> con un descuento moderado para los primeros días, y una <strong>Etapa 2 (Última Hora)</strong> con un descuento mayor para rematar el inventario restante antes de que venza, garantizando que <strong>nunca vendas por debajo de tu costo</strong>.
            </p>
          </div>

          {/* Parámetros de entrada con explicaciones en lenguaje comercial */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-content-primary">
                Precio en carta (P) $
              </label>
              <span className="block text-[10px] text-content-muted mb-1">
                Valor normal del plato sin descuento
              </span>
              <input
                type="number"
                min="1"
                step="500"
                className={inputCls}
                value={regularPrice}
                onChange={(e) => setRegularPrice(Number(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-content-primary">
                Costo de preparación (C) $
              </label>
              <span className="block text-[10px] text-content-muted mb-1">
                Lo que te cuestan insumos y empaque
              </span>
              <input
                type="number"
                min="1"
                step="500"
                className={inputCls}
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-content-primary">
                Platos disponibles (K)
              </label>
              <span className="block text-[10px] text-content-muted mb-1">
                Cupo total para toda la campaña
              </span>
              <input
                type="number"
                min="1"
                className={inputCls}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-content-primary">
                Descuento Etapa 1 (p₁ %)
              </label>
              <span className="block text-[10px] text-content-muted mb-1">
                Descuento moderado para primeros días
              </span>
              <input
                type="number"
                min="1"
                max="98"
                className={inputCls}
                value={discountPct1}
                onChange={(e) => setDiscountPct1(Number(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-content-primary">
                Descuento Última Hora (p₂ %)
              </label>
              <span className="block text-[10px] text-content-muted mb-1">
                Descuento mayor para remate final
              </span>
              <input
                type="number"
                min="2"
                max="99"
                className={inputCls}
                value={discountPct2}
                onChange={(e) => setDiscountPct2(Number(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-content-primary">
                Ventas esperadas Etapa 1 (D₁)
              </label>
              <span className="block text-[10px] text-content-muted mb-1">
                Clientes que comprarían con el dcto. inicial
              </span>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={maxDemandStage1}
                onChange={(e) => setMaxDemandStage1(Number(e.target.value) || 0)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-content-primary">
                Tope máximo a ceder en descuentos (B) $ COP
              </label>
              <span className="block text-[10px] text-content-muted mb-1">
                Presupuesto máximo total que estás dispuesto a descontar entre todos los cupones
              </span>
              <input
                type="number"
                min="1000"
                step="10000"
                className={inputCls}
                value={maxDiscountBudget}
                onChange={(e) => setMaxDiscountBudget(Number(e.target.value) || 0)}
              />
            </div>

            <div className="sm:col-span-1 flex items-end">
              <button
                type="button"
                onClick={handleCalculate}
                disabled={mutation.isPending}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs py-2 px-3 rounded-button transition-colors shadow-subtle flex items-center justify-center gap-1.5"
              >
                <IconChart size={13} />
                <span>{mutation.isPending ? "Calculando..." : "Calcular distribución"}</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-button">
              {errorMessage}
            </div>
          )}

          {result && (
            <div className="space-y-3 pt-1">
              {/* Tarjetas de Solución Óptima: x*, y*, Z* explicadas en lenguaje de negocio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="bg-surface-card border border-surface-border rounded-card p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-content-muted block">
                    Etapa 1 · Normal ({discountPct1}% OFF)
                  </span>
                  <div className="text-lg font-bold text-content-primary tabular-nums mt-0.5">
                    {Math.round(result.xOpt)} <span className="text-xs font-medium text-content-secondary">cupones (x*)</span>
                  </div>
                  <span className="text-[11px] text-content-secondary block mt-1 tabular-nums leading-snug">
                    Ganas <strong>${result.u1.toLocaleString()}</strong> libres por plato (descuentas ${result.d1.toLocaleString()}).
                  </span>
                </div>

                <div className="bg-surface-card border border-surface-border rounded-card p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-content-muted block">
                    Etapa 2 · Última Hora ({discountPct2}% OFF)
                  </span>
                  <div className="text-lg font-bold text-brand-700 tabular-nums mt-0.5">
                    {Math.round(result.yOpt)} <span className="text-xs font-medium text-content-secondary">cupones (y*)</span>
                  </div>
                  <span className="text-[11px] text-content-secondary block mt-1 tabular-nums leading-snug">
                    Ganas <strong>${result.u2.toLocaleString()}</strong> libres por plato (descuentas ${result.d2.toLocaleString()}).
                  </span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-card p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block">
                    Ganancia Libre Total (Z*)
                  </span>
                  <div className="text-lg font-bold text-emerald-800 tabular-nums mt-0.5">
                    ${result.maxProfit.toLocaleString()} <span className="text-xs font-semibold">COP</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 block mt-1 tabular-nums leading-snug">
                    Vendiendo {Math.round(result.totalCoupons)} de tus {maxCapacity} platos (después de costos).
                  </span>
                </div>
              </div>

              {/* Resumen de recursos / Variables de Holgura explicadas de forma clara */}
              <div className="bg-surface-card border border-surface-border rounded-card p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[11px] font-semibold text-content-primary">
                    Balance de tu capacidad y presupuesto (Holguras del modelo)
                  </span>
                  <span className="font-mono text-[10px] text-content-muted">
                    Max Z = {result.u1.toLocaleString()}x + {result.u2.toLocaleString()}y
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-surface-muted/70 border border-surface-border rounded-button px-2.5 py-2">
                    <span className="text-content-primary font-semibold block">
                      Platos sin comprometer (s₁)
                    </span>
                    <strong className="text-brand-700 font-mono tabular-nums text-xs">
                      {result.s1UnusedCapacity} platos
                    </strong>
                    <span className="text-[10px] text-content-muted block mt-0.5">
                      Inventario que te queda libre para venta normal en mesa
                    </span>
                  </div>
                  <div className="bg-surface-muted/70 border border-surface-border rounded-button px-2.5 py-2">
                    <span className="text-content-primary font-semibold block">
                      Demanda inicial restante (s₂)
                    </span>
                    <strong className="text-content-primary font-mono tabular-nums text-xs">
                      {result.s2UnmetDemandStage1} cupones
                    </strong>
                    <span className="text-[10px] text-content-muted block mt-0.5">
                      {result.s2UnmetDemandStage1 === 0
                        ? "Cubres el 100% de los clientes esperados en Etapa 1"
                        : "Clientes estimados en Etapa 1 que no alcanzan cupo"}
                    </span>
                  </div>
                  <div className="bg-surface-muted/70 border border-surface-border rounded-button px-2.5 py-2">
                    <span className="text-content-primary font-semibold block">
                      Presupuesto sobrante (s₃)
                    </span>
                    <strong className="text-content-primary font-mono tabular-nums text-xs">
                      ${result.s3RemainingBudget.toLocaleString()} COP
                    </strong>
                    <span className="text-[10px] text-content-muted block mt-0.5">
                      {result.s3RemainingBudget === 0
                        ? "Aprovechas al máximo tu presupuesto de descuento"
                        : "Margen de descuento que no necesitaste gastar"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Método Gráfico 2D en SVG */}
              <FeasibleRegionSvgChart
                K={maxCapacity}
                D1={maxDemandStage1}
                B={maxDiscountBudget}
                result={result}
              />

              {/* Botones para aplicar x* y/o y* al formulario con transición automática */}
              <div className="bg-surface-card border border-surface-border rounded-card p-3.5 space-y-2.5">
                <div>
                  <span className="text-xs font-semibold text-content-primary block">
                    Aplicar solución óptima a este cupón
                  </span>
                  <p className="text-[11px] text-content-secondary mt-0.5 leading-relaxed">
                    Elige cómo deseas activar el precio dinámico en tu cupón. Además, <strong>tu cupón quedará identificado con la insignia de Precio Dinámico</strong> en tu panel para que puedas monitorear en qué etapa va:
                  </p>
                </div>

                {/* Opción recomendada: Automatizada Etapa 1 -> Etapa 2 */}
                <div className="border border-emerald-200 rounded-card p-3 bg-emerald-50/50 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-emerald-900 inline-flex items-center gap-1.5">
                        <IconSparkles size={13} className="text-emerald-700" />
                        <span>Opción Recomendada · Transición Automática (Etapa 1 → Etapa 2)</span>
                      </span>
                      <span className="text-[10px] font-semibold bg-white border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-button tabular-nums">
                        Total {Math.round(result.totalCoupons)} cupos ({Math.round(result.xOpt)} al {discountPct1}% + {Math.round(result.yOpt)} al {discountPct2}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-900/80 mt-1 leading-relaxed">
                      <strong>¿Cómo funciona?</strong> El cupón inicia hoy en <strong>Etapa 1 ({discountPct1}% OFF)</strong> sin avisarle al cliente que el precio bajará después (para proteger tu margen). En el instante exacto en que se canjee el cupón <strong>#{Math.round(result.xOpt)}</strong>, el sistema <strong>pasará automáticamente a la Etapa 2 ({discountPct2}% OFF)</strong> para los {Math.round(result.yOpt)} cupos restantes, activará la etiqueta <em>"Última Hora"</em> para los clientes y te mostrará el cambio de etapa en tu panel.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const xQty = Math.max(1, Math.round(result.xOpt));
                      const totalQty = Math.max(xQty, Math.round(result.totalCoupons));
                      onApplyStage({
                        discountType: "PERCENTAGE",
                        discountValue: discountPct1,
                        maxRedemptions: totalQty,
                        stageLabel: `Automático: Etapa 1 (${xQty} al ${discountPct1}%) → Etapa 2 (${Math.round(result.yOpt)} al ${discountPct2}%)`,
                        dynamicPricingEnabled: true,
                        stage1MaxRedemptions: xQty,
                        stage1DiscountValue: discountPct1,
                        stage2DiscountValue: discountPct2,
                      });
                      setAppliedBanner(
                        `Activada Transición Automática: inicia al ${discountPct1}% OFF y al llegar a ${xQty} canjes sube sola al ${discountPct2}% OFF (total ${totalQty} cupos).`
                      );
                    }}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-2 px-3 rounded-button transition-colors text-center shadow-subtle"
                  >
                    Activar Precio Dinámico Automático (Etapa 1 → Etapa 2)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="border border-surface-border rounded-card p-2.5 bg-surface-canvas/50 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-content-primary">
                          Solo Etapa 1 (Normal)
                        </span>
                        <span className="text-[10px] font-semibold bg-white border border-surface-border text-content-primary px-2 py-0.5 rounded-button tabular-nums">
                          {Math.round(result.xOpt)} cupos · {discountPct1}% OFF
                        </span>
                      </div>
                      <p className="text-[10px] text-content-secondary mt-1 leading-snug">
                        <strong>¿Cuándo elegirla?</strong> Si prefieres lanzar únicamente los <strong>{Math.round(result.xOpt)} cupos</strong> iniciales al <strong>{discountPct1}%</strong> sin cambio automático a segunda etapa.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const qty = Math.max(1, Math.round(result.xOpt));
                        onApplyStage({
                          discountType: "PERCENTAGE",
                          discountValue: discountPct1,
                          maxRedemptions: qty,
                          stageLabel: `Etapa 1 Normal (${qty} cupones al ${discountPct1}% OFF)`,
                          dynamicPricingEnabled: true,
                          stage1MaxRedemptions: qty,
                          stage1DiscountValue: discountPct1,
                          stage2DiscountValue: null,
                        });
                        setAppliedBanner(
                          `Se aplicó solo la Etapa 1 al formulario: ${discountPct1}% de descuento y límite de ${qty} canjes.`
                        );
                      }}
                      className="w-full bg-white hover:bg-surface-muted text-content-primary border border-surface-border text-xs font-semibold py-1.5 px-3 rounded-button transition-colors text-center shadow-subtle"
                    >
                      Usar solo Etapa 1
                    </button>
                  </div>

                  <div className="border border-brand-200 rounded-card p-2.5 bg-brand-50/40 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-brand-700">
                          Solo Etapa 2 (Última Hora)
                        </span>
                        <span className="text-[10px] font-semibold bg-brand-100 border border-brand-200 text-brand-800 px-2 py-0.5 rounded-button tabular-nums">
                          {Math.round(result.yOpt)} cupos · {discountPct2}% OFF
                        </span>
                      </div>
                      <p className="text-[10px] text-content-secondary mt-1 leading-snug">
                        <strong>¿Cuándo elegirla?</strong> Si quieres publicar directamente un cupón relámpago de última hora con los <strong>{Math.round(result.yOpt)} cupos</strong> al <strong>{discountPct2}%</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const qty = Math.max(1, Math.round(result.yOpt));
                        onApplyStage({
                          discountType: "PERCENTAGE",
                          discountValue: discountPct2,
                          maxRedemptions: qty,
                          stageLabel: `Etapa 2 Última Hora (${qty} cupones al ${discountPct2}% OFF)`,
                          dynamicPricingEnabled: true,
                          stage1MaxRedemptions: 0,
                          stage1DiscountValue: discountPct1,
                          stage2DiscountValue: discountPct2,
                        });
                        setAppliedBanner(
                          `Se aplicó directamente la Etapa 2 (Última Hora): ${discountPct2}% de descuento y límite de ${qty} canjes.`
                        );
                      }}
                      className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-1.5 px-3 rounded-button transition-colors text-center shadow-subtle"
                    >
                      Usar directo Etapa 2
                    </button>
                  </div>
                </div>

                {appliedBanner && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 pt-0.5">
                    <IconCheckCircle size={13} />
                    <span>{appliedBanner}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Visualización 2D de la Región Factible, rectas R1, R2, R3, recta Isoutilidad Z* y Punto Óptimo (x*, y*)
 */
function FeasibleRegionSvgChart({
  K,
  D1,
  B,
  result,
}: {
  K: number;
  D1: number;
  B: number;
  result: PricingOptimizationResponse;
}) {
  const { d1, d2, u1, u2, xOpt, yOpt, maxProfit, vertices } = result;
  if (d1 <= 0 || d2 <= 0 || K <= 0) return null;

  const xMax = Math.max(K, D1, B / d1, 10) * 1.15;
  const yMax = Math.max(K, B / d2, 10) * 1.18;

  const W = 440;
  const H = 220;
  const padL = 38;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const toSvgX = (x: number) => padL + (Math.min(Math.max(x, 0), xMax) / xMax) * plotW;
  const toSvgY = (y: number) => padT + plotH - (Math.min(Math.max(y, 0), yMax) / yMax) * plotH;

  const polygonPoints =
    vertices && vertices.length >= 3
      ? vertices.map((v) => `${toSvgX(v.x).toFixed(1)},${toSvgY(v.y).toFixed(1)}`).join(" ")
      : "";

  // R1: x + y = K => (0, K) a (K, 0)
  const r1x1 = toSvgX(0);
  const r1y1 = toSvgY(K);
  const r1x2 = toSvgX(K);
  const r1y2 = toSvgY(0);

  // R2: x = D1
  const r2x = toSvgX(D1);

  // R3: d1*x + d2*y = B => (0, B/d2) a (B/d1, 0)
  const r3x1 = toSvgX(0);
  const r3y1 = toSvgY(B / d2);
  const r3x2 = toSvgX(B / d1);
  const r3y2 = toSvgY(0);

  // Isoutilidad: u1*x + u2*y = Z*
  const isoX1 = toSvgX(0);
  const isoY1 = toSvgY(u2 > 0 ? maxProfit / u2 : 0);
  const isoX2 = toSvgX(u1 > 0 ? maxProfit / u1 : 0);
  const isoY2 = toSvgY(0);

  const optCx = toSvgX(xOpt);
  const optCy = toSvgY(yOpt);

  return (
    <div className="bg-surface-card border border-surface-border rounded-card p-3 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-[11px] font-semibold text-content-primary block">
            Mapa de combinaciones posibles y punto de máxima ganancia
          </span>
          <span className="text-[10px] text-content-muted block">
            El área verde muestra todas las combinaciones que respetan tu capacidad y presupuesto; el punto rojo marca la combinación que más dinero te deja.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-content-secondary">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-stone-500 inline-block" /> Capacidad
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-content-primary inline-block" /> Demanda
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-emerald-700 inline-block" /> Presupuesto
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-600 inline-block" /> Óptimo
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto bg-surface-canvas/60 rounded-button border border-surface-border"
        role="img"
        aria-label="Gráfico 2D de la región factible y punto óptimo"
      >
        {/* Ejes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#D6D1C7" strokeWidth="1" />
        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#D6D1C7" strokeWidth="1" />

        {/* Polígono de la Región Factible */}
        {polygonPoints && (
          <polygon
            points={polygonPoints}
            fill="rgba(45, 106, 79, 0.16)"
            stroke="rgba(45, 106, 79, 0.45)"
            strokeWidth="1"
          />
        )}

        {/* R1: Capacidad x + y <= K */}
        <line
          x1={r1x1}
          y1={r1y1}
          x2={r1x2}
          y2={r1y2}
          stroke="#78716C"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* R2: Demanda x <= D1 */}
        <line
          x1={r2x}
          y1={padT}
          x2={r2x}
          y2={padT + plotH}
          stroke="#1C1917"
          strokeWidth="1.5"
        />

        {/* R3: Presupuesto d1*x + d2*y <= B */}
        <line
          x1={r3x1}
          y1={r3y1}
          x2={r3x2}
          y2={r3y2}
          stroke="#2D6A4F"
          strokeWidth="1.8"
        />

        {/* Recta Isoutilidad Z* */}
        <line
          x1={isoX1}
          y1={isoY1}
          x2={isoX2}
          y2={isoY2}
          stroke="#C84B31"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />

        {/* Punto óptimo (x*, y*) */}
        <circle
          cx={optCx}
          cy={optCy}
          r="5"
          fill="#C84B31"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        <text
          x={Math.min(optCx + 8, W - 115)}
          y={Math.max(optCy - 8, padT + 12)}
          fontSize="10"
          fontWeight="700"
          fill="#C84B31"
        >
          ({Math.round(xOpt)}, {Math.round(yOpt)}) · Z*=${(maxProfit / 1000).toFixed(0)}k
        </text>

        {/* Etiquetas de ejes */}
        <text x={padL + plotW / 2} y={H - 6} fontSize="9.5" textAnchor="middle" fill="#57534E">
          x: Cupones Etapa Normal (0 → {Math.round(xMax)})
        </text>
        <text
          x={12}
          y={padT + plotH / 2}
          fontSize="9.5"
          textAnchor="middle"
          fill="#57534E"
          transform={`rotate(-90 12 ${padT + plotH / 2})`}
        >
          y: Última Hora
        </text>
      </svg>
    </div>
  );
}
