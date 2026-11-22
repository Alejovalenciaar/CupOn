import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyFavorites, toggleFavorite } from '@/api/promotionServices';
import {
  getMyFavoriteRestaurants,
  toggleFavoriteRestaurant,
} from '@/api/restaurantServices';
import { useAuth } from '@/context/AuthContext';
import { IconArrowLeft, IconHeart, IconLock, IconTicket, IconUtensils } from '@/components/Icons';
import { Promotion, Restaurant } from '@/types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CouponCard from './components/CouponCard';
import RestaurantCard from './components/RestaurantCard';
import CouponDetailModal from './components/CouponDetailModal';

interface FavoritesPageProps {
  onBack?: () => void;
}

export default function FavoritesPage({ onBack }: FavoritesPageProps = {}) {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const isClient = currentUser?.role === 'ROLE_CLIENTE';

  const [activeTab, setActiveTab] = useState<'cupones' | 'restaurantes'>('cupones');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Promotion | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (isClient) {
      Promise.all([getMyFavorites(0, 50), getMyFavoriteRestaurants(0, 50)])
        .then(([promosData, restData]) => {
          setPromotions(promosData.content || []);
          setRestaurants(restData.content || []);
        })
        .catch(() => {
          setError('No se pudieron cargar tus favoritos.');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isClient]);

  const handleToggleFavoritePromo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isClient) {
        await toggleFavorite(id);
      }
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch {
      /* ignore */
    }
  };

  const handleToggleFavoriteRestaurant = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isClient) {
        await toggleFavoriteRestaurant(id);
      }
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    } catch {
      /* ignore */
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary antialiased flex flex-col">
      <Navbar
        currentUser={currentUser}
        favoriteCount={promotions.length}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 space-y-6">
        {/* Cabecera y Pestañas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => (onBack ? onBack() : navigate('/'))}
                className="text-xs text-content-secondary hover:text-content-primary inline-flex items-center gap-1.5 font-medium transition-colors"
              >
                <IconArrowLeft size={13} />
                <span>Volver al catálogo</span>
              </button>
              <span className="text-surface-border">/</span>
              <h1 className="text-xl font-bold tracking-tight text-content-primary">
                Mis Favoritos
              </h1>
            </div>
            <p className="text-xs text-content-secondary mt-1 tabular-nums">
              {promotions.length} {promotions.length === 1 ? 'cupón' : 'cupones'} y{' '}
              {restaurants.length} {restaurants.length === 1 ? 'restaurante guardado' : 'restaurantes guardados'}
            </p>
          </div>

          {isClient && (
            <div className="inline-flex bg-surface-muted p-1 rounded-button border border-surface-border self-start sm:self-auto">
              <button
                type="button"
                id="tab-favoritos-cupones"
                onClick={() => setActiveTab('cupones')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-button transition-colors flex items-center gap-2 ${
                  activeTab === 'cupones'
                    ? 'bg-white text-content-primary shadow-subtle'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <IconTicket size={14} className={activeTab === 'cupones' ? 'text-brand-600' : 'text-content-muted'} />
                <span>Cupones</span>
                <span className="bg-surface-muted border border-surface-border text-content-primary text-[10px] font-semibold px-1.5 py-0.2 rounded-full tabular-nums">
                  {promotions.length}
                </span>
              </button>

              <button
                type="button"
                id="tab-favoritos-restaurantes"
                onClick={() => setActiveTab('restaurantes')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-button transition-colors flex items-center gap-2 ${
                  activeTab === 'restaurantes'
                    ? 'bg-white text-content-primary shadow-subtle'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <IconUtensils size={14} className={activeTab === 'restaurantes' ? 'text-brand-600' : 'text-content-muted'} />
                <span>Restaurantes</span>
                <span className="bg-surface-muted border border-surface-border text-content-primary text-[10px] font-semibold px-1.5 py-0.2 rounded-full tabular-nums">
                  {restaurants.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Estado no autenticado */}
        {!isClient && (
          <div className="bg-surface-card border border-surface-border rounded-card p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-11 h-11 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center mx-auto text-content-secondary">
              <IconLock size={18} />
            </div>
            <h2 className="text-base font-semibold text-content-primary">
              Inicia sesión para sincronizar tus favoritos
            </h2>
            <p className="text-xs text-content-secondary leading-relaxed">
              Guarda tus cupones y restaurantes preferidos y accede a ellos desde cualquier dispositivo.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs px-4 py-2 rounded-button transition-colors"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isClient && loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-surface-card border border-surface-border rounded-card p-4 animate-pulse space-y-3"
              >
                <div className="aspect-[16/9] bg-surface-muted rounded-button w-full" />
                <div className="h-4 bg-surface-muted rounded w-3/4" />
                <div className="h-3 bg-surface-muted rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-card">
            {error}
          </div>
        )}

        {/* Pestaña: Cupones */}
        {isClient && !loading && !error && activeTab === 'cupones' && (
          <>
            {promotions.length === 0 ? (
              <div className="bg-surface-card border border-surface-border rounded-card p-12 text-center max-w-md mx-auto space-y-3">
                <div className="w-11 h-11 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center mx-auto text-content-secondary">
                  <IconHeart size={18} />
                </div>
                <h2 className="text-base font-semibold text-content-primary">
                  No tienes cupones guardados
                </h2>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Explora las opciones culinarias de la semana y marca el icono de favorito en tus preferidas.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs px-4 py-2 rounded-button transition-colors"
                  >
                    Explorar catálogo
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {promotions.map((promo) => (
                  <CouponCard
                    key={promo.id}
                    promo={promo}
                    isFavorite={true}
                    onToggleFavorite={handleToggleFavoritePromo}
                    onSelect={(p) => setSelected(p)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Pestaña: Restaurantes */}
        {isClient && !loading && !error && activeTab === 'restaurantes' && (
          <>
            {restaurants.length === 0 ? (
              <div className="bg-surface-card border border-surface-border rounded-card p-12 text-center max-w-md mx-auto space-y-3">
                <div className="w-11 h-11 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center mx-auto text-content-secondary">
                  <IconUtensils size={18} />
                </div>
                <h2 className="text-base font-semibold text-content-primary">
                  No tienes restaurantes guardados
                </h2>
                <p className="text-xs text-content-secondary leading-relaxed">
                  Guarda tus establecimientos aliados favoritos para consultar su perfil y sus ofertas más rápido.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs px-4 py-2 rounded-button transition-colors"
                  >
                    Explorar restaurantes
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    isFavorite={true}
                    onToggleFavorite={handleToggleFavoriteRestaurant}
                    onFilterPromotions={(name) =>
                      navigate(`/?search=${encodeURIComponent(name)}`)
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      {selected && (
        <CouponDetailModal
          promo={selected}
          isFavorite={true}
          onClose={() => setSelected(null)}
          onToggleFavorite={handleToggleFavoritePromo}
        />
      )}
    </div>
  );
}
