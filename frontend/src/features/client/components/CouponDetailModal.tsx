import { useEffect, useState } from 'react';
import { Promotion, RedemptionResponse } from '@/types';
import { redeemPromotion, registerPromotionView } from '@/api/promotionServices';
import ActiveDaysPills from './ActiveDaysPills';

interface CouponDetailModalProps {
  promo: Promotion;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export default function CouponDetailModal({
  promo,
  isFavorite,
  onClose,
  onToggleFavorite,
}: CouponDetailModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<RedemptionResponse | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  useEffect(() => {
    registerPromotionView(promo.id);
  }, [promo.id]);

  const days = (promo as any).daysOfWeek || [];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const handleShare = () => {
    const text = `¡Descubre este cupón en CupOn! ${promo.title} en ${promo.restaurantName} (Código: ${promo.code})`;
    if (navigator.share) {
      navigator.share({ title: promo.title, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} - ${window.location.href}`).then(() => {
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      });
    }
  };

  const handleRedeem = async () => {
    setRedeemLoading(true);
    setRedeemError(null);
    try {
      const res = await redeemPromotion(promo.id);
      setRedeemResult(res);
    } catch (err: any) {
      setRedeemError(err.response?.data?.message || 'No se pudo canjear el cupón.');
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-card border border-surface-border rounded-card shadow-hover w-full max-w-lg overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Imagen del cupón */}
        <div className="relative aspect-[16/9] w-full bg-surface-muted overflow-hidden">
          <img
            src={
              promo.imageUrl ||
              'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=450&fit=crop'
            }
            alt={promo.title}
            className="w-full h-full object-cover"
          />

          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            className="absolute top-3 end-3 w-8 h-8 rounded-full bg-white/90 text-content-primary hover:bg-white flex items-center justify-center shadow-subtle border border-surface-border text-sm"
          >
            ✕
          </button>

          <div className="absolute bottom-3 start-3">
            <span className="bg-brand-600 text-white text-xs font-semibold px-2.5 py-1 rounded-button shadow-subtle">
              {promo.discountType === 'PERCENTAGE'
                ? `${promo.discountValue}% DE DESCUENTO`
                : `$${Number(promo.discountValue).toLocaleString()} DE DESCUENTO`}
            </span>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 flex flex-col space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-brand-700 uppercase tracking-wide">
                {promo.restaurantName}
              </span>
              <ActiveDaysPills days={days} />
            </div>
            <h2 className="text-lg font-bold text-content-primary tracking-tight">
              {promo.title}
            </h2>
            <p className="text-xs text-content-secondary mt-1">
              {promo.description || 'Presenta este cupón en el establecimiento para disfrutar del descuento.'}
            </p>
          </div>

          {/* Tabla de condiciones y vigencia */}
          <div className="bg-surface-muted border border-surface-border rounded-card p-3 space-y-2 text-xs">
            <div className="flex justify-between text-content-secondary">
              <span>Compra mínima:</span>
              <span className="font-semibold text-content-primary">
                {Number(promo.minPurchase) > 0
                  ? `$${Number(promo.minPurchase).toLocaleString()} COP`
                  : 'Sin consumo mínimo'}
              </span>
            </div>
            <div className="flex justify-between text-content-secondary">
              <span>Vigencia:</span>
              <span className="font-semibold text-content-primary">
                Hasta el {new Date(promo.endDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between text-content-secondary">
              <span>Disponibilidad:</span>
              <span className="font-semibold text-content-primary">
                {promo.maxRedemptions > 0
                  ? `${promo.maxRedemptions - (promo.currentRedemptions || 0)} cupones restantes`
                  : 'Ilimitada'}
              </span>
            </div>
          </div>

          {/* Cuadro de Código de Canje */}
          <div className="border border-dashed border-brand-500 bg-brand-50/50 rounded-card p-4 text-center">
            <span className="text-xs text-brand-700 font-medium block mb-1">
              Código de canje
            </span>
            <div className="font-mono text-xl font-bold tracking-widest text-brand-700 mb-2">
              {promo.code}
            </div>
            <button
              type="button"
              onClick={() => handleCopy(promo.code)}
              className="inline-flex items-center gap-1.5 bg-white border border-brand-200 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-button shadow-subtle hover:bg-brand-50 transition-colors"
            >
              <span>{copiedCode ? '¡Copiado al portapapeles! ✓' : 'Copiar código'}</span>
            </button>
          </div>

          {/* Canje en vivo */}
          {redeemResult ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-card p-3.5 text-center text-emerald-800">
              <span className="text-xl block mb-1">✅</span>
              <p className="text-xs font-bold">¡Cupón canjeado con éxito!</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Código validado: <strong className="font-mono">{redeemResult.code}</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {redeemError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-button">
                  {redeemError}
                </div>
              )}
              <button
                type="button"
                onClick={handleRedeem}
                disabled={redeemLoading}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-button text-sm transition-colors shadow-subtle flex items-center justify-center gap-2"
              >
                {redeemLoading ? 'Validando canje...' : 'Confirmar canje en local'}
              </button>
            </div>
          )}

          {/* Acciones Secundarias */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 bg-white hover:bg-surface-muted text-content-secondary border border-surface-border text-xs font-medium py-2 rounded-button transition-colors flex items-center justify-center gap-1"
            >
              <span>{copiedShare ? '¡Enlace copiado! ✓' : 'Compartir oferta'}</span>
            </button>
            <button
              type="button"
              onClick={(e) => onToggleFavorite(promo.id, e)}
              className="bg-white hover:bg-surface-muted text-content-secondary border border-surface-border text-xs font-medium px-4 py-2 rounded-button transition-colors flex items-center gap-1"
            >
              <span>{isFavorite ? '❤️ Guardado' : '🤍 Guardar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
