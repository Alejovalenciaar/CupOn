import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRestaurantById, toggleFavoriteRestaurant, getMyFavoriteRestaurants } from "@/api/restaurantServices";
import { getPromotions, toggleFavorite, getMyFavorites } from "@/api/promotionServices";
import { useAuth } from "@/context/AuthContext";
import {
  formatInstagramHandle,
  IconArrowLeft,
  IconHeart,
  IconInstagram,
  IconMapPin,
  IconPhone,
  IconShare,
  normalizeInstagramUrl,
} from "@/components/Icons";
import type { Promotion, Restaurant } from "@/types";
import RestaurantMap from "@/components/RestaurantMap";
import CouponCard from "./components/CouponCard";
import CouponDetailModal from "./components/CouponDetailModal";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cupon_favorites") || "[]");
    } catch {
      return [];
    }
  });
  const [isFavRestaurant, setIsFavRestaurant] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getRestaurantById(id)
      .then(async (rest) => {
        setRestaurant(rest);
        const promoPage = await getPromotions(rest.businessName, 0, 50);
        setPromotions((promoPage.content || []).filter((p) => p.restaurantId === rest.id));
      })
      .catch(() => setError("No encontramos la información de este restaurante."))
      .finally(() => setLoading(false));

    if (user?.role === "ROLE_CLIENTE") {
      getMyFavorites(0, 100)
        .then((d) => setFavoriteIds((d.content || []).map((p) => p.id)))
        .catch(() => {});
      getMyFavoriteRestaurants(0, 100)
        .then((d) => setIsFavRestaurant((d.content || []).some((r) => r.id === id)))
        .catch(() => {});
    } else {
      try {
        const saved: string[] = JSON.parse(localStorage.getItem("cupon_fav_restaurants") || "[]");
        setIsFavRestaurant(saved.includes(id));
      } catch {
        setIsFavRestaurant(false);
      }
    }
  }, [id, user?.role]);

  const handleToggleFavoritePromo = (promoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const exists = prev.includes(promoId);
      const next = exists ? prev.filter((x) => x !== promoId) : [...prev, promoId];
      if (user?.role !== "ROLE_CLIENTE") {
        localStorage.setItem("cupon_favorites", JSON.stringify(next));
      }
      return next;
    });
    if (user?.role === "ROLE_CLIENTE") {
      toggleFavorite(promoId).catch(() => {});
    }
  };

  const handleToggleFavoriteRestaurant = () => {
    if (!restaurant) return;
    const next = !isFavRestaurant;
    setIsFavRestaurant(next);
    if (user?.role === "ROLE_CLIENTE") {
      toggleFavoriteRestaurant(restaurant.id).catch(() => setIsFavRestaurant(!next));
    } else {
      try {
        const saved: string[] = JSON.parse(localStorage.getItem("cupon_fav_restaurants") || "[]");
        const updated = next ? [...saved, restaurant.id] : saved.filter((x) => x !== restaurant.id);
        localStorage.setItem("cupon_fav_restaurants", JSON.stringify(updated));
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary antialiased flex flex-col">
      <Navbar currentUser={user} favoriteCount={favoriteIds.length} onLogout={logout} />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xs font-medium text-content-secondary hover:text-brand-600 inline-flex items-center gap-1.5 transition-colors"
          >
            <IconArrowLeft size={13} />
            <span>Volver al catálogo</span>
          </button>
        </div>

        {loading && (
          <div className="bg-surface-card border border-surface-border rounded-card p-8 animate-pulse space-y-4">
            <div className="h-48 bg-surface-muted rounded-button w-full" />
            <div className="h-6 bg-surface-muted rounded w-1/3" />
            <div className="h-4 bg-surface-muted rounded w-2/3" />
          </div>
        )}

        {error && !loading && (
          <div className="bg-surface-card border border-surface-border rounded-card p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-content-primary">{error}</p>
            <Link
              to="/"
              className="inline-block bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-4 py-2 rounded-button"
            >
              Ir al inicio
            </Link>
          </div>
        )}

        {restaurant && !loading && (
          <>
            {/* Perfil del restaurante */}
            <section className="bg-surface-card border border-surface-border rounded-card shadow-subtle overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-5 relative aspect-[16/10] lg:aspect-auto bg-surface-muted">
                  <img
                    src={
                      restaurant.logoUrl ||
                      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop"
                    }
                    alt={restaurant.businessName}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 start-3 bg-surface-card/95 backdrop-blur-sm text-content-primary border border-surface-border text-xs font-semibold px-2.5 py-1 rounded-button shadow-subtle inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Aliado Oficial
                  </span>
                </div>

                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
                            {restaurant.businessName}
                          </h1>
                          {restaurant.cuisineType && (
                            <span className="bg-brand-50 text-brand-700 border border-brand-200 text-xs font-medium px-2.5 py-0.5 rounded-button">
                              {restaurant.cuisineType}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleFavoriteRestaurant}
                        className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-button border border-surface-border bg-white hover:bg-surface-muted transition-colors ${
                          isFavRestaurant ? "text-brand-600" : "text-content-secondary"
                        }`}
                      >
                        <IconHeart size={14} filled={isFavRestaurant} />
                        <span>{isFavRestaurant ? "Guardado" : "Guardar"}</span>
                      </button>
                    </div>

                    <p className="text-sm text-content-secondary leading-relaxed">
                      {restaurant.description ||
                        "Restaurante aliado certificado por CupOn con promociones exclusivas."}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-content-secondary">
                      <div className="bg-surface-muted border border-surface-border rounded-button px-3 py-2 flex items-center gap-2">
                        <IconMapPin size={14} className="text-content-muted" />
                        <span className="truncate">{restaurant.address}</span>
                      </div>
                      {restaurant.phoneNumber && (
                        <div className="bg-surface-muted border border-surface-border rounded-button px-3 py-2 flex items-center gap-2 tabular-nums">
                          <IconPhone size={14} className="text-content-muted" />
                          <span className="truncate">{restaurant.phoneNumber}</span>
                        </div>
                      )}
                      <a
                        href={normalizeInstagramUrl(restaurant.instagramUrl, restaurant.businessName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-surface-muted hover:bg-brand-50/70 border border-surface-border hover:border-brand-200 rounded-button px-3 py-2 flex items-center gap-2 text-content-primary hover:text-brand-700 transition-colors"
                      >
                        <IconInstagram size={14} className="text-brand-600 shrink-0" />
                        <span className="truncate font-medium">
                          {formatInstagramHandle(restaurant.instagramUrl, restaurant.businessName)}
                        </span>
                      </a>
                    </div>

                    {/* Acciones directas de contacto y navegación */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={
                          restaurant.latitude != null && restaurant.longitude != null
                            ? `https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${restaurant.businessName} ${restaurant.address}`
                              )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-primary bg-surface-canvas hover:bg-surface-muted border border-surface-border px-3 py-1.5 rounded-button transition-colors"
                      >
                        <IconMapPin size={13} className="text-brand-600" />
                        <span>Cómo llegar (Google Maps)</span>
                        <IconShare size={12} className="text-content-muted" />
                      </a>
                      {restaurant.phoneNumber && (
                        <a
                          href={`https://wa.me/${restaurant.phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Hola, vi las ofertas de ${restaurant.businessName} en CupOn y me gustaría consultar disponibilidad.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-button transition-colors"
                        >
                          <IconPhone size={13} />
                          <span>Escribir por WhatsApp</span>
                        </a>
                      )}
                      <a
                        href={normalizeInstagramUrl(restaurant.instagramUrl, restaurant.businessName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-button transition-colors"
                      >
                        <IconInstagram size={13} />
                        <span>Ver Instagram</span>
                      </a>
                    </div>
                  </div>

                  {restaurant.latitude != null && restaurant.longitude != null && (
                    <RestaurantMap
                      latitude={restaurant.latitude}
                      longitude={restaurant.longitude}
                      businessName={restaurant.businessName}
                      address={restaurant.address}
                      interactive={false}
                      heightClassName="h-44"
                    />
                  )}
                </div>
              </div>
            </section>

            {/* Cupones activos del restaurante */}
            <section className="space-y-4">
              <div className="border-b border-surface-border pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-content-primary">
                    Cupones vigentes ({promotions.length})
                  </h2>
                  <p className="text-xs text-content-secondary mt-0.5">
                    Promociones activas en {restaurant.businessName}
                  </p>
                </div>
              </div>

              {promotions.length === 0 ? (
                <div className="bg-surface-card border border-surface-border rounded-card p-10 text-center">
                  <p className="text-sm font-medium text-content-primary">
                    Este restaurante no tiene cupones activos en este momento.
                  </p>
                  <p className="text-xs text-content-secondary mt-1">
                    Guárdalo en tus favoritos para volver a revisar pronto.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {promotions.map((promo) => (
                    <CouponCard
                      key={promo.id}
                      promo={promo}
                      isFavorite={favoriteIds.includes(promo.id)}
                      onToggleFavorite={handleToggleFavoritePromo}
                      onSelect={(p) => setSelectedPromo(p)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />

      {selectedPromo && (
        <CouponDetailModal
          promo={selectedPromo}
          isFavorite={favoriteIds.includes(selectedPromo.id)}
          onClose={() => setSelectedPromo(null)}
          onToggleFavorite={handleToggleFavoritePromo}
        />
      )}
    </div>
  );
}
