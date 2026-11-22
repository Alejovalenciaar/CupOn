import { Link } from 'react-router-dom';
import { Promotion } from '@/types';
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
  const remaining = promo.maxRedemptions > 0 ? Math.max(0, promo.maxRedemptions - (promo.currentRedemptions || 0)) : null;
  const isLowStock = !isExpired && remaining !== null && remaining > 0 && remaining <= 10;
  const days = promo.daysOfWeek || [];

  return (
    <div
      onClick={() => onSelect(promo)}
      className="group bg-surface-card border border-surface-border rounded-card shadow-subtle hover:shadow-hover transition-all duration-200 flex flex-col overflow-hidden cursor-pointer h-full"
    >
      {/* Contenedor de Imagen con Aspect Ratio 16/9 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-muted">
        <img
          src={promo.imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=338&fit=crop'}
          alt={promo.title}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isExpired ? 'grayscale' : ''
          }`}
          loading="lazy"
        />

        {/* Botón de Favorito */}
        <button
          type="button"
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          onClick={(e) => onToggleFavorite(promo.id, e)}
          className="absolute top-2.5 start-2.5 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-subtle border border-surface-border flex items-center justify-center hover:bg-white transition-transform active:scale-95"
        >
          <span className="text-sm">{isFavorite ? '❤️' : '🤍'}</span>
        </button>

        {/* Badge de Descuento/Oferta sobrio */}
        <div className="absolute top-2.5 end-2.5 flex flex-col items-end gap-1">
          <span className="bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold px-2 py-0.5 rounded-button shadow-subtle">
            {promo.discountType === 'PERCENTAGE'
              ? `${promo.discountValue}% OFF`
              : `$${Number(promo.discountValue).toLocaleString()}`}
          </span>
          {isLowStock && (
            <span className="bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-button shadow-subtle">
              Últimos {remaining}
            </span>
          )}
          {!isLowStock && isEndingSoon && (
            <span className="bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-button shadow-subtle">
              Termina pronto
            </span>
          )}
          {!isLowStock && !isEndingSoon && isNew && (
            <span className="bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-button shadow-subtle">
              Nuevo
            </span>
          )}
        </div>

        {isExpired && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-slate-900/90 text-white text-xs font-medium px-2.5 py-1 rounded-button">
              Vencido
            </span>
          </div>
        )}
      </div>

      {/* Contenido Editorial */}
      <div className="p-4 flex flex-col flex-1">
        {/* Metadatos superiores: Restaurante y Días Activos */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <Link
            to={`/restaurante/${promo.restaurantId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-brand-700 hover:underline truncate tracking-wide uppercase"
          >
            {promo.restaurantName}
          </Link>
          <ActiveDaysPills days={days} />
        </div>

        {/* Título de la promoción */}
        <h3 className="font-semibold text-content-primary text-base tracking-tight line-clamp-1 mb-1 group-hover:text-brand-600 transition-colors">
          {promo.title}
        </h3>

        {/* Descripción */}
        <p className="text-xs text-content-secondary line-clamp-2 mb-2 flex-1">
          {promo.description || 'Promoción especial para deleitar tu paladar.'}
        </p>

        {promo.startTime && promo.endTime && (
          <p className="text-[11px] text-content-muted mb-2">
            🕒 Válido de {promo.startTime.slice(0, 5)} a {promo.endTime.slice(0, 5)}
          </p>
        )}

        {/* Información de Vigencia y Cupón */}
        <div className="pt-2.5 border-t border-surface-border flex items-center justify-between text-xs text-content-secondary mb-3">
          <span className="flex items-center gap-1">
            <span className="text-accent-600 font-medium">Vence:</span>
            <span>
              {new Date(promo.endDate).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </span>

          <span className="font-mono font-semibold bg-surface-muted px-2 py-0.5 rounded text-content-primary border border-surface-border text-[11px]">
            {promo.code}
          </span>
        </div>

        {/* Botón de Acción Principal */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(promo);
          }}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-button text-sm transition-colors flex items-center justify-center gap-1.5 shadow-subtle active:scale-[0.99]"
        >
          <span>Canjear cupón</span>
          <span className="text-xs opacity-80">→</span>
        </button>
      </div>
    </div>
  );
}
