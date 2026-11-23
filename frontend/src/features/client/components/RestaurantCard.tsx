import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Restaurant } from '@/types';
import { formatDistance } from '@/utils/geo';
import {
  formatInstagramHandle,
  IconArrowRight,
  IconHeart,
  IconInstagram,
  IconMapPin,
  IconPhone,
  normalizeInstagramUrl,
} from '@/components/Icons';
import RestaurantMap from '@/components/RestaurantMap';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isFavorite?: boolean;
  distanceKm?: number | null;
  activePromoCount?: number;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
  onFilterPromotions: (restaurantName: string) => void;
}

export default function RestaurantCard({
  restaurant,
  isFavorite = false,
  distanceKm = null,
  activePromoCount = 0,
  onToggleFavorite,
  onFilterPromotions,
}: RestaurantCardProps) {
  const [showMap, setShowMap] = useState(false);

  return (
    <article className="group bg-surface-card border border-surface-border hover:border-brand-200 rounded-card shadow-subtle hover:shadow-hover transition-all duration-200 flex flex-col overflow-hidden h-full">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-muted">
        <img
          src={
            restaurant.logoUrl ||
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=338&fit=crop'
          }
          alt={restaurant.businessName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
          <span className="bg-surface-card/95 backdrop-blur-sm text-content-primary border border-surface-border text-[11px] font-semibold px-2 py-0.5 rounded-button shadow-subtle flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
            Aliado Oficial
          </span>
          {distanceKm != null && (
            <span className="bg-content-primary/90 text-white text-[11px] font-semibold px-2 py-0.5 rounded-button shadow-subtle inline-flex items-center gap-1 tabular-nums">
              <IconMapPin size={12} />
              <span>{formatDistance(distanceKm)}</span>
            </span>
          )}
          {activePromoCount > 0 && (
            <span className="bg-brand-600/95 text-white text-[11px] font-semibold px-2 py-0.5 rounded-button shadow-subtle tabular-nums">
              {activePromoCount} {activePromoCount === 1 ? 'oferta' : 'ofertas'}
            </span>
          )}
        </div>

        {onToggleFavorite && (
          <button
            type="button"
            aria-label={isFavorite ? 'Quitar restaurante de favoritos' : 'Guardar restaurante en favoritos'}
            onClick={(e) => onToggleFavorite(restaurant.id, e)}
            className={`absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-subtle border border-surface-border flex items-center justify-center hover:bg-white transition-transform active:scale-95 ${
              isFavorite ? 'text-brand-600' : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            <IconHeart size={15} filled={isFavorite} />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link
            to={`/restaurante/${restaurant.id}`}
            className="font-semibold tracking-tight text-content-primary text-base group-hover:text-brand-600 transition-colors"
          >
            {restaurant.businessName}
          </Link>
          {restaurant.cuisineType && (
            <span className="shrink-0 bg-surface-muted text-content-secondary font-medium px-2 py-0.5 rounded-button text-[11px] border border-surface-border">
              {restaurant.cuisineType}
            </span>
          )}
        </div>

        <p className="text-xs text-content-secondary line-clamp-2 mb-3 flex-1 leading-relaxed">
          {restaurant.description || 'Especialidad gastronómica con ingredientes seleccionados y ambiente acogedor.'}
        </p>

        <div className="space-y-1.5 text-xs text-content-secondary border-t border-surface-border pt-2.5 mb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <IconMapPin size={14} className="text-content-muted" />
              <span className="truncate">{restaurant.address}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMap((prev) => !prev)}
              className="shrink-0 text-[11px] font-medium text-content-secondary hover:text-content-primary bg-surface-muted border border-surface-border px-2 py-0.5 rounded-button transition-colors"
            >
              {showMap ? 'Ocultar mapa' : 'Mapa'}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            {restaurant.phoneNumber && (
              <div className="flex items-center gap-1.5 truncate tabular-nums">
                <IconPhone size={13} className="text-content-muted" />
                <span className="truncate">{restaurant.phoneNumber}</span>
              </div>
            )}
            <a
              href={normalizeInstagramUrl(restaurant.instagramUrl, restaurant.businessName)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:text-brand-800 hover:underline truncate"
              title={`Visitar Instagram de ${restaurant.businessName}`}
            >
              <IconInstagram size={12} className="text-brand-600 shrink-0" />
              <span className="truncate">
                {formatInstagramHandle(restaurant.instagramUrl, restaurant.businessName)}
              </span>
            </a>
          </div>
        </div>

        {showMap && (
          <div className="mb-3">
            <RestaurantMap
              latitude={restaurant.latitude}
              longitude={restaurant.longitude}
              businessName={restaurant.businessName}
              address={restaurant.address}
              interactive={false}
              heightClassName="h-44"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/restaurante/${restaurant.id}`}
            className="bg-surface-canvas hover:bg-brand-600 hover:border-brand-600 hover:text-white text-content-primary font-semibold px-3 py-2 rounded-button text-xs border border-surface-border transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Ver local</span>
            <IconArrowRight size={13} />
          </Link>
          <button
            type="button"
            onClick={() => onFilterPromotions(restaurant.businessName)}
            className="bg-white hover:bg-surface-muted text-content-secondary hover:text-content-primary font-medium px-3 py-2 rounded-button text-xs border border-surface-border transition-colors flex items-center justify-center"
          >
            <span>Filtrar ofertas</span>
          </button>
        </div>
      </div>
    </article>
  );
}
