import type { RedemptionHistoryItem } from "@/types";
import { IconCheckCircle, IconClock } from "@/components/Icons";

interface RedemptionValidatorTabProps {
  redemptions: RedemptionHistoryItem[];
  verifyCodeInput: string;
  verifyingCode: boolean;
  verifyFeedback: { msg: string; type: "success" | "error" } | null;
  onChangeCode: (value: string) => void;
  onSubmitVerify: (e: React.FormEvent) => void;
}

export default function RedemptionValidatorTab({
  redemptions,
  verifyCodeInput,
  verifyingCode,
  verifyFeedback,
  onChangeCode,
  onSubmitVerify,
}: RedemptionValidatorTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-content-primary">Validar canje en caja</h1>
        <p className="text-xs text-content-secondary mt-0.5">
          Ingresa el código único que presenta el cliente (ej. CUP-A7X9K2) para confirmar el uso del cupón
        </p>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-card p-5 shadow-subtle max-w-xl">
        <form onSubmit={onSubmitVerify} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="CUP-XXXXXX"
            value={verifyCodeInput}
            onChange={(e) => onChangeCode(e.target.value.toUpperCase())}
            className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500 shadow-subtle font-mono tracking-widest uppercase flex-1"
          />
          <button
            type="submit"
            disabled={verifyingCode}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-button transition-colors shadow-subtle whitespace-nowrap"
          >
            {verifyingCode ? "Validando..." : "Validar código"}
          </button>
        </form>
        {verifyFeedback && (
          <div
            className={`mt-3 px-3 py-2.5 rounded-button text-xs border ${
              verifyFeedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {verifyFeedback.msg}
          </div>
        )}
      </div>

      <div className="bg-surface-card border border-surface-border rounded-card p-5 shadow-subtle">
        <h2 className="text-sm font-semibold text-content-primary mb-4">Historial de canjes recientes</h2>
        {redemptions.length === 0 ? (
          <p className="text-xs text-content-muted text-center py-6">
            Aún no hay canjes registrados para tus promociones.
          </p>
        ) : (
          <div className="divide-y divide-surface-border">
            {redemptions.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold bg-surface-muted border border-surface-border px-2 py-0.5 rounded-button text-content-primary">
                      {item.verificationCode}
                    </span>
                    <span className="text-xs font-semibold text-content-primary truncate">
                      {item.promotionTitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-content-muted">
                    {item.customerEmail || "Cliente anónimo"} ·{" "}
                    {new Date(item.redeemedAt).toLocaleString("es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-button border self-start sm:self-center shrink-0 ${
                    item.verified
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {item.verified ? <IconCheckCircle size={12} /> : <IconClock size={12} />}
                  <span>{item.verified ? "Validado en caja" : "Pendiente"}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
