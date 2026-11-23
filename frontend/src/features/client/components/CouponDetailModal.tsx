import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Promotion, RedemptionResponse } from '@/types';
import { redeemPromotion, registerPromotionView } from '@/api/promotionServices';
import { useAuth } from '@/context/AuthContext';
import { IconCheckCircle, IconHeart, IconInstagram, IconLink, normalizeInstagramUrl } from '@/components/Icons';
import VerificationQrPass from '@/components/VerificationQrPass';
import ActiveDaysPills from './ActiveDaysPills';

const shareButtonClass =
  'bg-white hover:bg-surface-muted text-content-secondary border border-surface-border text-xs font-medium py-2 rounded-button transition-colors flex items-center justify-center text-center';

/**
 * Copia texto al portapapeles. Si la API Clipboard no está disponible
 * (HTTP sin TLS o navegador antiguo), usa un textarea temporal.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  }
}

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<RedemptionResponse | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  useEffect(() => {
    registerPromotionView(promo.id);
  }, [promo.id]);

  // Bloquear el scroll de la página trasera mientras el modal está abierto + cerrar con Escape
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const days = (promo as any).daysOfWeek || [];

  const handleCopy = (code: string) => {
    copyToClipboard(code).then((ok) => {
      if (!ok) return;
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  // Enlace público del cupón (HU 24 / HU 27)
  const shareUrl = `${window.location.origin}/promo/${promo.id}`;
  const shareText = `¡Descubre este cupón en CupOn! ${promo.title} en ${promo.restaurantName}`;
  const isRedeemable = promo.status === 'ACTIVE';

  const handleNativeShare = () => {
    navigator.share({ title: promo.title, text: shareText, url: shareUrl }).catch(() => {});
  };

  const handleCopyLink = () => {
    copyToClipboard(shareUrl).then((ok) => {
      if (!ok) return;
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    });
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const instagramUrl = normalizeInstagramUrl(promo.restaurantInstagramUrl, promo.restaurantName);

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
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-card border border-surface-border rounded-card shadow-hover w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Imagen del cupón compacta y fija en la cabecera */}
        <div className="relative h-40 sm:h-44 w-full bg-surface-muted overflow-hidden shrink-0">
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

          <div className="absolute bottom-3 start-3 flex items-center gap-1.5 flex-wrap">
            <span className="bg-content-primary/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-button shadow-subtle tabular-nums">
              {promo.discountType === 'PERCENTAGE'
                ? `${promo.discountValue}% DE DESCUENTO`
                : `$${Number(promo.discountValue).toLocaleString()} DE DESCUENTO`}
            </span>
            {promo.dynamicPricingEnabled && promo.currentDynamicStage === 2 && (
              <span className="bg-brand-600/95 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-button shadow-subtle">
                Oferta de Última Hora
              </span>
            )}
          </div>
        </div>

        {/* Cuerpo del Modal con scroll interno contenido */}
        <div className="p-5 flex flex-col space-y-3.5 overflow-y-auto overscroll-contain">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-brand-700 uppercase tracking-wide">
                {promo.restaurantName}
              </span>
              <ActiveDaysPills days={days} />
            </div>
            <h2 className="text-lg font-bold text-content-primary tracking-tight leading-snug">
              {promo.title}
            </h2>
            <p className="text-xs text-content-secondary mt-1 leading-relaxed">
              {promo.description || 'Presenta este cupón en el establecimiento para disfrutar del descuento.'}
            </p>
          </div>

          {/* Tabla de condiciones y vigencia */}
          <div className="bg-surface-muted border border-surface-border rounded-card p-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-content-secondary">
              <span>Compra mínima:</span>
              <span className="font-semibold text-content-primary tabular-nums">
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
              <span className="font-semibold text-content-primary tabular-nums">
                {promo.maxRedemptions > 0
                  ? `${Math.max(0, promo.maxRedemptions - (promo.currentRedemptions || 0))} cupones restantes`
                  : 'Ilimitada'}
              </span>
            </div>
          </div>

          {/* Código o Pase QR unificado (evita duplicar altura al canjear) */}
          {redeemResult ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-card p-3.5 text-emerald-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <IconCheckCircle size={15} className="text-emerald-600" />
                  <span>¡Cupón canjeado con éxito!</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(redeemResult.verificationCode || redeemResult.code)}
                  className="text-[11px] font-semibold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-button transition-colors"
                >
                  {copiedCode ? '¡Copiado! ✓' : 'Copiar pase'}
                </button>
              </div>
              {redeemResult.verificationCode && (
                <div className="bg-white border border-emerald-200 rounded-card p-3 flex items-center gap-3.5">
                  <VerificationQrPass verificationCode={redeemResult.verificationCode} size={68} />
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
                      Pase de verificación en caja
                    </span>
                    <span className="font-mono text-lg font-bold tracking-widest text-content-primary block mt-0.5">
                      {redeemResult.verificationCode}
                    </span>
                    <span className="text-[11px] text-content-secondary block mt-0.5">
                      Cupón: <strong className="font-mono text-content-primary">{redeemResult.code}</strong>
                    </span>
                  </div>
                </div>
              )}
              <div className="pt-1 text-right">
                <Link
                  to="/redemptions"
                  onClick={onClose}
                  className="text-xs font-semibold text-emerald-800 hover:underline"
                >
                  Ver todos mis pases en Mis Canjes →
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="border border-dashed border-brand-500 bg-brand-50/50 rounded-card px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-brand-700 font-medium block">
                    Código de referencia
                  </span>
                  <div className="font-mono text-lg font-bold tracking-widest text-brand-700">
                    {promo.code}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(promo.code)}
                  className="shrink-0 inline-flex items-center gap-1.5 bg-white border border-brand-200 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-button shadow-subtle hover:bg-brand-50 transition-colors"
                >
                  <span>{copiedCode ? '¡Copiado! ✓' : 'Copiar código'}</span>
                </button>
              </div>

              {!isRedeemable ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-card text-center">
                  Este cupón ya no está disponible para canje.
                </div>
              ) : !user ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/login');
                  }}
                  className="w-full bg-content-primary hover:bg-brand-600 text-white font-semibold px-4 py-2.5 rounded-button text-xs sm:text-sm transition-colors shadow-subtle flex items-center justify-center gap-2"
                >
                  <span>Inicia sesión para obtener tu pase QR →</span>
                </button>
              ) : user.role !== 'ROLE_CLIENTE' ? (
                <div className="bg-surface-muted border border-surface-border text-content-secondary text-xs p-2.5 rounded-button text-center">
                  Vista previa · El reclamo de pases QR está reservado para cuentas de comensal.
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
                    {redeemLoading ? 'Generando pase QR...' : 'Obtener pase QR para canjear en local'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Compartir (HU 24 / HU 27) */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-medium text-content-secondary block">Compartir oferta</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`${shareButtonClass} gap-1.5`}
              >
                <IconLink size={13} />
                <span>{copiedShare ? '¡Copiado!' : 'Copiar enlace'}</span>
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={shareButtonClass}
              >
                WhatsApp
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${shareButtonClass} gap-1.5`}
                title={`Visitar Instagram de ${promo.restaurantName}`}
              >
                <IconInstagram size={13} />
                <span>Instagram</span>
              </a>
            </div>
          </div>

          {/* Acciones Secundarias */}
          <div className="flex items-center gap-2">
            {typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex-1 bg-white hover:bg-surface-muted text-content-secondary border border-surface-border text-xs font-medium py-2 rounded-button transition-colors flex items-center justify-center gap-1"
              >
                <span>Más opciones…</span>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => onToggleFavorite(promo.id, e)}
              className={`flex-1 bg-white hover:bg-surface-muted border border-surface-border text-xs font-medium px-4 py-2 rounded-button transition-colors flex items-center justify-center gap-1.5 ${
                isFavorite ? 'text-brand-600' : 'text-content-secondary'
              }`}
            >
              <IconHeart size={14} filled={isFavorite} />
              <span>{isFavorite ? 'Guardado' : 'Guardar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
