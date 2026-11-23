import { Link } from 'react-router-dom';
import { Promotion } from '@/types';
import { IconArrowRight, IconClock, IconHeart } from '@/components/Icons';
import { isPromotionAvailableNow } from '@/utils/schedule';
import ActiveDaysPills from './ActiveDaysPills';

interface CouponCardProps {
  promo: Promotion;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSelect: (promo: Promotion) => void;
}

export default function CouponCard({
  promo,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: CouponCardProps) {
  const now = Date.now();
  const endMs = new Date(promo.endDate).getTime();
  const createdMs = promo.createdAt ? new Date(promo.createdAt).getTime() : 0;
  const isExpired = endMs < now;
  const isEndingSoon = !isExpired && endMs - now <= 48 * 60 * 60 * 1000;
  const isNew = !isExpired && createdMs > 0 && now - createdMs <= 3 * 24 * 60 * 60 * 1000;
  const remaining =
    promo.maxRedemptions > 0
      ? Math.max(0, promo.maxRedemptions - (promo.currentRedemptions || 0))
      : null;
  const isLowStock = !isExpired && remaining !== null && remaining > 0 && remaining <= 10;
  const availableNow = isPromotionAvailableNow(promo);
  const days = promo.daysOfWeek || [];

  const discountLabel =
    promo.discountType === 'PERCENTAGE'
      ? `${promo.discountValue}% OFF`
      : `$${Number(promo.discountValue).toLocaleString()} OFF`;

  return (
    <article
      onClick={() => onSelect(promo)}
      className="group bg-surface-card border border-surface-border hover:border-brand-200 rounded-card shadow-subtle hover:shadow-hover transition-all duration-200 flex flex-col overflow-hidden cursor-pointer h-full"
    >
      {/* Imagen 16:9 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-muted">
        <img
          src={
            promo.imageUrl ||
            'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=338&fit=crop'
          }
          alt={promo.title}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isExpired ? 'grayscale' : ''
          }`}
          loading="lazy"
        />

        {/* Favorito vectorial */}
        <button
          type="button"
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          onClick={(e) => onToggleFavorite(promo.id, e)}
          className={`absolute top-2.5 start-2.5 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-subtle border border-surface-border flex items-center justify-center hover:bg-white transition-transform active:scale-95 ${
            isFavorite ? 'text-brand-600' : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          <IconHeart size={15} filled={isFavorite} />
        </button>

        {/* Estado secundario (urgencia / novedad / última hora dinámica) */}
        <div className="absolute top-2.5 end-2.5 flex flex-col items-end gap-1">
          {!isExpired && promo.dynamicPricingEnabled && promo.currentDynamicStage === 2 && (
            <span className="bg-brand-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-button shadow-subtle">
              Última Hora · Dcto. Mejorado
            </span>
          )}
          {isLowStock && (
            <span className="bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-button shadow-subtle tabular-nums">
              Últimos {remaining}
            </span>
          )}
          {!isLowStock && isEndingSoon && (
            <span className="bg-amber-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-button shadow-subtle">
              Termina pronto
            </span>
          )}
          {!isLowStock && !isEndingSoon && isNew && (
            <span className="bg-emerald-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded-button shadow-subtle">
              Nuevo
            </span>
          )}
        </div>

        {/* Sello de descuento protagonista en la esquina inferior */}
        <div className="absolute bottom-2.5 start-2.5">
          <span className="bg-content-primary/90 backdrop-blur-sm text-white text-xs font-bold tracking-tight px-2.5 py-1 rounded-button shadow-subtle tabular-nums">
            {discountLabel}
          </span>
        </div>

        {isExpired && (
          <div className="absolute inset-0 bg-stone-900/45 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-stone-900/90 text-white text-xs font-medium px-2.5 py-1 rounded-button">
              Vencido
            </span>
          </div>
        )}
      </div>

      {/* Cuerpo del cupón */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <Link
            to={`/restaurante/${promo.restaurantId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] font-semibold text-brand-700 hover:underline truncate tracking-wider uppercase"
          >
            {promo.restaurantName}
          </Link>
          <ActiveDaysPills days={days} />
        </div>

        <h3 className="font-semibold text-content-primary text-[15px] leading-snug tracking-tight line-clamp-1 mb-1 group-hover:text-brand-600 transition-colors">
          {promo.title}
        </h3>

        <p className="text-xs text-content-secondary line-clamp-2 mb-2 flex-1 leading-relaxed">
          {promo.description || 'Promoción especial disponible presentando el código en el local.'}
        </p>

        {promo.startTime && promo.endTime && (
          <p className="text-[11px] text-content-muted mb-2 inline-flex items-center gap-1.5 tabular-nums">
            <IconClock size={13} />
            <span>
              {promo.startTime.slice(0, 5)} – {promo.endTime.slice(0, 5)}
            </span>
          </p>
        )}

        {/* Troquel de boleto con muescas laterales */}
        <div className="relative my-2.5 border-t border-dashed border-surface-border">
          <span
            aria-hidden="true"
            className="absolute -left-6 -top-2 w-3.5 h-3.5 rounded-full bg-surface-canvas border border-surface-border"
          />
          <span
            aria-hidden="true"
            className="absolute -right-6 -top-2 w-3.5 h-3.5 rounded-full bg-surface-canvas border border-surface-border"
          />
        </div>

        {/* Talón del boleto: código + vigencia + CTA sobrio */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="min-w-0">
            <span className="font-mono font-bold text-xs tracking-wider text-content-primary bg-surface-muted px-2 py-0.5 rounded border border-surface-border inline-block">
              {promo.code}
            </span>
            <span className="block text-[11px] text-content-muted mt-1 tabular-nums">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${
                  availableNow ? 'bg-emerald-600' : 'bg-stone-400'
                }`}
              />
              {availableNow ? 'Disponible ahora' : 'Fuera de horario'} · Hasta{' '}
              {new Date(promo.endDate).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(promo);
            }}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-button border border-surface-border bg-surface-canvas text-content-primary group-hover:bg-brand-600 group-hover:border-brand-600 group-hover:text-white transition-colors"
          >
            <span>Canjear</span>
            <IconArrowRight size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}
