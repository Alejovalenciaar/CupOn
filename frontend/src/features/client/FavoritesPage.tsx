import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyFavorites, toggleFavorite } from '@/api/promotionServices';
import {
  getMyFavoriteRestaurants,
  toggleFavoriteRestaurant,
} from '@/api/restaurantServices';
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

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('cupon_user') || 'null');
    } catch {
      return null;
    }
  })();

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
        .catch((err) => {
          console.error('Error al cargar favoritos:', err);
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
    } catch (err) {
      console.error('Error al quitar cupón de favoritos:', err);
    }
  };

  const handleToggleFavoriteRestaurant = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isClient) {
        await toggleFavoriteRestaurant(id);
      }
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Error al quitar restaurante de favoritos:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cupon_user');
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (onBack ? onBack() : navigate('/'))}
                className="text-xs text-content-secondary hover:text-content-primary flex items-center gap-1 font-medium mr-2"
              >
                ← Volver al catálogo
              </button>
              <h1 className="text-xl font-bold tracking-tight text-content-primary">
                Mis Favoritos
              </h1>
            </div>
            <p className="text-xs text-content-secondary mt-0.5">
              {promotions.length} cupón{promotions.length !== 1 ? 'es' : ''} y{' '}
              {restaurants.length} restaurante{restaurants.length !== 1 ? 's' : ''} guardado
              {restaurants.length !== 1 ? 's' : ''}
            </p>
          </div>

          {isClient && (
            <div className="inline-flex bg-surface-muted p-1 rounded-button border border-surface-border self-start sm:self-auto">
              <button
                type="button"
                id="tab-favoritos-cupones"
                onClick={() => setActiveTab('cupones')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-button transition-colors flex items-center gap-1.5 ${
                  activeTab === 'cupones'
                    ? 'bg-white text-content-primary shadow-subtle'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <span>🎟️ Cupones</span>
                <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {promotions.length}
                </span>
              </button>

              <button
                type="button"
                id="tab-favoritos-restaurantes"
                onClick={() => setActiveTab('restaurantes')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-button transition-colors flex items-center gap-1.5 ${
                  activeTab === 'restaurantes'
                    ? 'bg-white text-content-primary shadow-subtle'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <span>🍽️ Restaurantes</span>
                <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {restaurants.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Estado no autenticado */}
        {!isClient && (
          <div className="bg-surface-card border border-surface-border rounded-card p-12 text-center max-w-md mx-auto space-y-3">
            <span className="text-3xl block">🔒</span>
            <h2 className="text-base font-semibold text-content-primary">
              Inicia sesión para sincronizar tus favoritos
            </h2>
            <p className="text-xs text-content-secondary">
              Guarda tus cupones y restaurantes preferidos y accede a ellos desde cualquier dispositivo en todo momento.
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
                <div className="aspect-[16/9] bg-surface-muted rounded-button w-full"></div>
                <div className="h-4 bg-surface-muted rounded w-3/4"></div>
                <div className="h-3 bg-surface-muted rounded w-full"></div>
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
                <span className="text-3xl block">🤍</span>
                <h2 className="text-base font-semibold text-content-primary">
                  No tienes cupones guardados
                </h2>
                <p className="text-xs text-content-secondary">
                  Explora las opciones culinarias de la semana y presiona el ❤️ en tus preferidas.
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
                <span className="text-3xl block">🍽️</span>
                <h2 className="text-base font-semibold text-content-primary">
                  No tienes restaurantes guardados
                </h2>
                <p className="text-xs text-content-secondary">
                  Guarda tus establecimientos aliados favoritos para encontrar sus ofertas más rápido.
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
