import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyRedemptions } from "@/api/promotionServices";
import { IconArrowLeft, IconCheckCircle, IconClock, IconTicket } from "@/components/Icons";
import VerificationQrPass from "@/components/VerificationQrPass";
import type { RedemptionHistoryItem } from "@/types";

export default function RedemptionsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RedemptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getMyRedemptions(0, 50)
      .then((res) => setItems(res.content || []))
      .catch(() => setError("No se pudo cargar tu historial de canjes."))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary antialiased flex flex-col">
      <header className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-cupon.svg" alt="CupOn" className="h-8 w-auto object-contain" />
          </Link>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-content-secondary hover:text-brand-600 px-3 py-1.5 rounded-button border border-surface-border hover:bg-surface-muted transition-colors"
          >
            <IconArrowLeft size={13} />
            <span>Volver al catálogo</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">Mis canjes</h1>
          <p className="text-xs text-content-secondary mt-1">
            Presenta tu código de verificación en la caja del restaurante para validar tu descuento.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 text-sm text-content-muted">
            Cargando tus canjes...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-card">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="bg-surface-card border border-surface-border rounded-card p-12 text-center">
            <div className="w-11 h-11 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center mx-auto mb-3 text-content-secondary">
              <IconTicket size={18} />
            </div>
            <h2 className="font-semibold text-content-primary text-base">
              Aún no has canjeado ningún cupón
            </h2>
            <p className="text-xs text-content-secondary mt-1 mb-4">
              Explora las ofertas vigentes y guarda tu código de verificación para presentarlo en el local.
            </p>
            <Link
              to="/"
              className="inline-block bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-4 py-2 rounded-button transition-colors"
            >
              Explorar cupones
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-surface-card border border-surface-border rounded-card p-5 shadow-subtle flex flex-col justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-brand-700 uppercase tracking-wide truncate">
                      {item.restaurantName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-button border shrink-0 ${
                        item.verified
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.verified ? <IconCheckCircle size={12} /> : <IconClock size={12} />}
                      <span>{item.verified ? "Validado en local" : "Pendiente en caja"}</span>
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-content-primary">{item.promotionTitle}</h3>
                  <p className="text-xs text-content-secondary">
                    Descuento:{" "}
                    <strong className="text-content-primary">
                      {item.discountType === "PERCENTAGE"
                        ? `${item.discountValue}% OFF`
                        : `$${Number(item.discountValue).toLocaleString()} COP`}
                    </strong>
                    {" · "}Canjeado el{" "}
                    {new Date(item.redeemedAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="bg-surface-canvas border border-dashed border-surface-border rounded-card p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <VerificationQrPass verificationCode={item.verificationCode} size={64} />
                    <div className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-wider font-semibold text-content-muted">
                        Pase de verificación
                      </span>
                      <span className="font-mono text-base font-bold tracking-widest text-content-primary block truncate">
                        {item.verificationCode}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.verificationCode)}
                    className="shrink-0 text-xs font-medium bg-white hover:bg-surface-muted text-content-primary border border-surface-border px-3 py-1.5 rounded-button transition-colors"
                  >
                    {copiedId === item.id ? "Copiado ✓" : "Copiar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
