import { useState } from 'react';
import { Restaurant } from '@/types';
import RestaurantMap from '@/components/RestaurantMap';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
  onFilterPromotions: (restaurantName: string) => void;
}

export default function RestaurantCard({
  restaurant,
  isFavorite = false,
  onToggleFavorite,
  onFilterPromotions,
}: RestaurantCardProps) {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="group bg-surface-card border border-surface-border rounded-card shadow-subtle hover:shadow-hover transition-all duration-200 flex flex-col overflow-hidden h-full">
      {/* Aspect Ratio 16/9 con recorte superior limpio */}
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
        <div className="absolute top-2.5 start-2.5">
          <span className="bg-surface-card/90 backdrop-blur-sm text-content-primary border border-surface-border text-xs font-semibold px-2 py-0.5 rounded-button shadow-subtle flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            Aliado Oficial
          </span>
        </div>

        {onToggleFavorite && (
          <button
            type="button"
            aria-label={isFavorite ? 'Quitar restaurante de favoritos' : 'Guardar restaurante en favoritos'}
            onClick={(e) => onToggleFavorite(restaurant.id, e)}
            className="absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-subtle border border-surface-border flex items-center justify-center hover:bg-white transition-transform active:scale-95"
          >
            <span className="text-sm">{isFavorite ? '❤️' : '🤍'}</span>
          </button>
        )}
      </div>

      {/* Contenido Editorial */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold tracking-tight text-content-primary text-base group-hover:text-brand-600 transition-colors">
            {restaurant.businessName}
          </h4>
          {restaurant.cuisineType && (
            <span className="shrink-0 bg-brand-50 text-brand-700 font-medium px-2 py-0.5 rounded-button text-[11px] border border-brand-200">
              {restaurant.cuisineType}
            </span>
          )}
        </div>

        <p className="text-xs text-content-secondary line-clamp-2 mb-3 flex-1">
          {restaurant.description || 'Especialidad gastronómica con ingredientes seleccionados y ambiente acogedor.'}
        </p>

        <div className="space-y-1 text-xs text-content-secondary border-t border-surface-border pt-2.5 mb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-content-muted">📍</span>
              <span className="truncate">{restaurant.address}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMap((prev) => !prev)}
              className="shrink-0 text-[11px] font-medium text-brand-600 hover:text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-button transition-colors"
            >
              {showMap ? 'Ocultar mapa' : '🗺️ Mapa'}
            </button>
          </div>
          {restaurant.phoneNumber && (
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-content-muted">📞</span>
              <span className="truncate">{restaurant.phoneNumber}</span>
            </div>
          )}
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

        <button
          type="button"
          onClick={() => onFilterPromotions(restaurant.businessName)}
          className="w-full bg-white hover:bg-surface-muted text-content-primary font-medium px-4 py-2 rounded-button text-sm border border-surface-border transition-colors flex items-center justify-center gap-1 shadow-subtle active:scale-[0.99]"
        >
          <span>Ver ofertas de este local</span>
        </button>
      </div>
    </div>
  );
}
