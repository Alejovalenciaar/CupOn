import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getPromotions, toggleFavorite, getMyFavorites, getCategories, getSharedPromotion } from "@/api/promotionServices";
import {
  getRestaurants,
  toggleFavoriteRestaurant,
  getMyFavoriteRestaurants,
} from "@/api/restaurantServices";
import { useAuth } from "@/context/AuthContext";
import { haversineKm } from "@/utils/geo";
import { isPromotionAvailableNow } from "@/utils/schedule";
import { CategoryIcon, IconClock, IconFlame, IconHeart, IconMapPin, IconSearch, IconTicket } from "@/components/Icons";
import type { Category, Promotion, Restaurant } from "@/types";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CouponCard from "./components/CouponCard";
import RestaurantCard from "./components/RestaurantCard";
import CouponDetailModal from "./components/CouponDetailModal";
import CuratedListsSection from "./components/CuratedListsSection";

const WEEK_DAYS = [
  { key: "", label: "Todos" },
  { key: "MONDAY", label: "Lun" },
  { key: "TUESDAY", label: "Mar" },
  { key: "WEDNESDAY", label: "Mié" },
  { key: "THURSDAY", label: "Jue" },
  { key: "FRIDAY", label: "Vie" },
  { key: "SATURDAY", label: "Sáb" },
  { key: "SUNDAY", label: "Dom" },
];

export default function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("search") || "";
  // Promoción abierta desde un enlace compartido (/promo/:id)
  const { id: sharedPromoId } = useParams<{ id: string }>();

  // Sesión centralizada
  const { user: currentUser, logout: handleLogout } = useAuth();

  // Promociones
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [loadingMorePromos, setLoadingMorePromos] = useState(false);
  const [promoPage, setPromoPage] = useState(0);
  const [hasMorePromos, setHasMorePromos] = useState(false);
  const [errorPromos, setErrorPromos] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeSearch, setActiveSearch] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState("");
  const [activeDay, setActiveDay] = useState("");
  const [sortPopular, setSortPopular] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Restaurantes
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRest, setLoadingRest] = useState(true);
  const [errorRest, setErrorRest] = useState<string | null>(null);
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Favoritos
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cupon_favorites") || "[]");
    } catch {
      return [];
    }
  });
  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cupon_fav_restaurants") || "[]");
    } catch {
      return [];
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAvailableNowOnly, setShowAvailableNowOnly] = useState(false);

  // Modal detalle
  const [selected, setSelected] = useState<Promotion | null>(null);
  const [sharedError, setSharedError] = useState<string | null>(null);
  const [visiblePromoLimit, setVisiblePromoLimit] = useState(4);

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchPromotions();
    fetchRestaurants();
    getCategories()
      .then(setCategories)
      .catch(() => { });

    // Sincronizar favoritos si hay sesión de cliente
    if (currentUser?.role === "ROLE_CLIENTE") {
      getMyFavorites(0, 100)
        .then((d) => setFavoriteIds((d.content || []).map((p) => p.id)))
        .catch(() => { });
      getMyFavoriteRestaurants(0, 100)
        .then((d) => setFavoriteRestaurantIds((d.content || []).map((r) => r.id)))
        .catch(() => { });
    }


    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Enlace compartido ────────────────────────────────────────────────────
  useEffect(() => {
    if (!sharedPromoId) return;
    setSharedError(null);
    getSharedPromotion(sharedPromoId)
      .then(setSelected)
      .catch(() => setSharedError("El cupón compartido no existe o ya no está disponible."));
  }, [sharedPromoId]);

  const handleCloseDetail = () => {
    setSelected(null);
    if (sharedPromoId) navigate("/", { replace: true });
  };

  const fetchPromotions = (query?: string, day?: string, categoryId?: string, popular?: boolean) => {
    setLoadingPromos(true);
    setErrorPromos(null);
    const q = query !== undefined ? query : activeSearch;
    const dow = day !== undefined ? day : activeDay;
    const cat = categoryId !== undefined ? categoryId : activeCategory;
    const pop = popular !== undefined ? popular : sortPopular;
    getPromotions(q || undefined, 0, 16, dow || undefined, cat || undefined, pop ? "popular" : undefined)
      .then((d) => {
        setPromotions(d.content);
        setPromoPage(d.page);
        setHasMorePromos(!d.last);
        setVisiblePromoLimit(4);
        setActiveSearch(q || "");
        setActiveDay(dow || "");
        setActiveCategory(cat || "");
        setSortPopular(pop);
      })
      .catch(() => setErrorPromos("No se pudieron cargar los cupones."))
      .finally(() => setLoadingPromos(false));
  };

  const handleLoadMorePromotions = () => {
    if (loadingMorePromos || !hasMorePromos) return;
    setLoadingMorePromos(true);
    const nextPage = promoPage + 1;
    getPromotions(
      activeSearch || undefined,
      nextPage,
      16,
      activeDay || undefined,
      activeCategory || undefined,
      sortPopular ? "popular" : undefined
    )
      .then((d) => {
        setPromotions((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          return [...prev, ...d.content.filter((p) => !existingIds.has(p.id))];
        });
        setPromoPage(d.page);
        setHasMorePromos(!d.last);
      })
      .catch(() => setErrorPromos("No se pudieron cargar más cupones."))
      .finally(() => setLoadingMorePromos(false));
  };

  const fetchRestaurants = (search?: string, cuisine?: string) => {
    setLoadingRest(true);
    setErrorRest(null);
    getRestaurants(0, 18, search, cuisine)
      .then((d) => setRestaurants(d.content))
      .catch(() => setErrorRest("No se pudieron cargar los restaurantes aliados."))
      .finally(() => setLoadingRest(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRestaurants(restaurantSearch, selectedCuisine);
    }, 300);
    return () => clearTimeout(timer);
  }, [restaurantSearch, selectedCuisine]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPromotions(searchTerm);
    document.getElementById("cupones")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCategory = (categoryId: string) => {
    fetchPromotions(undefined, undefined, categoryId);
    document.getElementById("cupones")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const isFav = prev.includes(id);
      const next = isFav ? prev.filter((x) => x !== id) : [...prev, id];
      if (currentUser?.role !== "ROLE_CLIENTE") {
        localStorage.setItem("cupon_favorites", JSON.stringify(next));
      }
      return next;
    });

    if (currentUser?.role === "ROLE_CLIENTE") {
      toggleFavorite(id).catch(() => {
        setFavoriteIds((prev) => {
          const isFav = prev.includes(id);
          return isFav ? prev.filter((x) => x !== id) : [...prev, id];
        });
      });
    }
  };

  const handleToggleFavoriteRestaurant = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteRestaurantIds((prev) => {
      const isFav = prev.includes(id);
      const next = isFav ? prev.filter((x) => x !== id) : [...prev, id];
      if (currentUser?.role !== "ROLE_CLIENTE") {
        localStorage.setItem("cupon_fav_restaurants", JSON.stringify(next));
      }
      return next;
    });

    if (currentUser?.role === "ROLE_CLIENTE") {
      toggleFavoriteRestaurant(id).catch(() => {
        setFavoriteRestaurantIds((prev) => {
          const isFav = prev.includes(id);
          return isFav ? prev.filter((x) => x !== id) : [...prev, id];
        });
      });
    }
  };

  const activeCategoryName = categories.find((c) => c.id === activeCategory)?.name;

  const displayedPromos = promotions.filter((p) => {
    if (showFavoritesOnly && !favoriteIds.includes(p.id)) return false;
    if (showAvailableNowOnly && !isPromotionAvailableNow(p)) return false;
    return true;
  });

  const handleToggleNearby = () => {
    if (userCoords) {
      setUserCoords(null);
      setGeoError(null);
      return;
    }
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocatingUser(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocatingUser(false);
      },
      () => {
        setGeoError("No pudimos obtener tu ubicación. Verifica los permisos del navegador.");
        setLocatingUser(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const displayedRestaurants = userCoords
    ? [...restaurants].sort((a, b) => {
        const distA =
          a.latitude != null && a.longitude != null
            ? haversineKm(userCoords.lat, userCoords.lng, a.latitude, a.longitude)
            : Number.POSITIVE_INFINITY;
        const distB =
          b.latitude != null && b.longitude != null
            ? haversineKm(userCoords.lat, userCoords.lng, b.latitude, b.longitude)
            : Number.POSITIVE_INFINITY;
        return distA - distB;
      })
    : restaurants;

  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary antialiased flex flex-col">
      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <Navbar
        currentUser={currentUser}
        favoriteCount={favoriteIds.length}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 space-y-12">
        {sharedError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-card flex items-center justify-between gap-3">
            <span>{sharedError}</span>
            <button
              type="button"
              onClick={() => {
                setSharedError(null);
                navigate("/", { replace: true });
              }}
              className="text-xs font-semibold hover:underline"
            >
              Ver catálogo
            </button>
          </div>
        )}

        {/* ── HERO SECTION EDITORIAL ─────────────────────────────────────────── */}
        <section
          id="inicio"
          className="relative bg-surface-card border border-surface-border rounded-card shadow-subtle p-6 sm:p-10 lg:p-12 overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">
                Guía de beneficios gastronómicos · Colombia
              </p>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-content-primary leading-[1.12]">
                La semana sabe mejor con <span className="text-brand-600">CupOn</span>.
              </h1>

              <p className="text-content-secondary text-sm sm:text-base max-w-xl leading-relaxed">
                Descuentos reales en restaurantes, cafés y barras locales. Elige tu cupón sin pagar por adelantado y preséntalo directamente en el establecimiento.
              </p>

              {/* Formulario de Búsqueda */}
              <form onSubmit={handleSearch} className="pt-2 max-w-lg">
                <div className="flex items-center gap-2 bg-white border border-surface-border p-1.5 rounded-card shadow-subtle focus-within:border-brand-500 transition-colors">
                  <IconSearch size={16} className="text-content-muted ml-2.5" />
                  <input
                    id="catalog-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar café, hamburguesa, bistró o cupón..."
                    className="flex-1 bg-transparent text-content-primary placeholder:text-content-muted text-sm px-2 py-1 outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        fetchPromotions("");
                      }}
                      className="text-xs text-content-muted hover:text-content-primary px-2"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-button transition-colors shadow-subtle"
                  >
                    Buscar
                  </button>
                </div>
              </form>
            </div>

            {/* Imagen Editorial Destacada */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="relative aspect-[4/3] rounded-card overflow-hidden border border-surface-border shadow-subtle">
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop"
                  alt="Experiencia gastronómica"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 end-3 bg-white/95 backdrop-blur-sm border border-surface-border rounded-card p-3 shadow-subtle">
                  <div className="text-[11px] font-semibold text-brand-700 uppercase tracking-wider">
                    Hasta 50% OFF
                  </div>
                  <div className="text-xs text-content-secondary mt-0.5">
                    De Lunes a Jueves en comercios aliados
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FILTROS POR CATEGORÍA ──────────────────────────────────────────── */}
        <section id="categorias" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-content-secondary">
              Especialidades gastronómicas
            </h2>
            {activeCategory && (
              <button
                onClick={() => fetchPromotions(undefined, undefined, "")}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Limpiar filtro ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[{ id: "", name: "Todos" } as Category, ...categories].map((cat) => {
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id || "all"}
                  type="button"
                  aria-pressed={isActive}
                  title={cat.description}
                  onClick={() => handleCategory(cat.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button text-xs sm:text-sm border whitespace-nowrap transition-colors ${isActive
                      ? "bg-content-primary border-content-primary text-white font-semibold shadow-subtle"
                      : "bg-white hover:bg-surface-muted text-content-secondary border-surface-border font-medium"
                    }`}
                >
                  <CategoryIcon
                    name={cat.name}
                    size={15}
                    className={isActive ? "text-brand-500" : "text-content-muted"}
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-medium text-content-muted whitespace-nowrap">Día:</span>
            {WEEK_DAYS.map(({ key, label }) => {
              const isActive = activeDay === key;
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => fetchPromotions(undefined, key)}
                  className={`px-3 py-1 rounded-button text-xs border whitespace-nowrap transition-colors ${isActive
                      ? "bg-brand-600 border-brand-600 text-white font-medium shadow-subtle"
                      : "bg-white hover:bg-surface-muted text-content-secondary border-surface-border font-normal"
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── SECCIÓN DE CUPONES DESTACADOS ──────────────────────────────────── */}
        <section id="cupones" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
            <div>
              <h2 className="font-semibold tracking-tight text-content-primary text-xl">
                {activeSearch
                  ? `Ofertas para "${activeSearch}"`
                  : activeCategoryName
                    ? `Ofertas en ${activeCategoryName}`
                    : "Cupones vigentes"}
              </h2>
              <p className="text-xs text-content-secondary mt-0.5">
                {activeSearch || activeCategoryName
                  ? "Resultados filtrados en tiempo real"
                  : "Promociones y beneficios gastronómicos activos"}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                aria-pressed={showAvailableNowOnly}
                onClick={() => setShowAvailableNowOnly((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium border transition-colors ${
                  showAvailableNowOnly
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white text-content-secondary border-surface-border hover:bg-surface-muted"
                }`}
              >
                <IconClock size={13} className={showAvailableNowOnly ? "text-emerald-600" : "text-content-muted"} />
                <span>Disponibles ahora</span>
              </button>
              <button
                type="button"
                id="btn-sort-popular"
                aria-pressed={sortPopular}
                title="Ordena por canjes, favoritos y vistas"
                onClick={() => fetchPromotions(undefined, undefined, undefined, !sortPopular)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium border transition-colors ${sortPopular
                    ? "bg-brand-50 text-brand-700 border-brand-200"
                    : "bg-white text-content-secondary border-surface-border hover:bg-surface-muted"
                  }`}
              >
                <IconFlame size={14} className={sortPopular ? "text-brand-600" : "text-content-muted"} />
                <span>Más populares</span>
              </button>
              <button
                type="button"
                id="btn-toggle-favorites"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium border transition-colors ${showFavoritesOnly
                    ? "bg-brand-50 text-brand-700 border-brand-200"
                    : "bg-white text-content-secondary border-surface-border hover:bg-surface-muted"
                  }`}
              >
                <IconHeart size={14} filled={showFavoritesOnly} className={showFavoritesOnly ? "text-brand-600" : "text-content-muted"} />
                <span>Guardados</span>
                {favoriteIds.length > 0 && (
                  <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                    {favoriteIds.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Estado de carga */}
          {loadingPromos && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-surface-card border border-surface-border rounded-card p-4 animate-pulse space-y-3"
                >
                  <div className="aspect-[16/9] bg-surface-muted rounded-button w-full"></div>
                  <div className="h-4 bg-surface-muted rounded w-3/4"></div>
                  <div className="h-3 bg-surface-muted rounded w-full"></div>
                  <div className="h-8 bg-surface-muted rounded-button w-full mt-4"></div>
                </div>
              ))}
            </div>
          )}

          {errorPromos && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-card">
              {errorPromos}
            </div>
          )}

          {!loadingPromos && !errorPromos && displayedPromos.length === 0 && (
            <div className="bg-surface-card border border-surface-border rounded-card p-12 text-center max-w-lg mx-auto">
              <div className="w-10 h-10 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center mx-auto mb-3 text-content-secondary">
                {showFavoritesOnly ? <IconHeart size={18} /> : <IconTicket size={18} />}
              </div>
              <h3 className="font-semibold text-content-primary text-base">
                {showFavoritesOnly
                  ? "Aún no tienes cupones guardados"
                  : activeSearch
                    ? `No se encontraron ofertas para "${activeSearch}"`
                    : activeCategoryName
                      ? `No hay ofertas en ${activeCategoryName} por ahora`
                      : "No hay ofertas para el día seleccionado"}
              </h3>
              <p className="text-xs text-content-secondary mt-1 mb-4">
                {showFavoritesOnly
                  ? "Toca el corazón en cualquier tarjeta para guardarla en tus favoritos."
                  : "Intenta con términos como 'Café', 'Burger' o limpia el filtro de búsqueda."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowFavoritesOnly(false);
                  setSearchTerm("");
                  fetchPromotions("", "", "");
                }}
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-4 py-2 rounded-button transition-colors"
              >
                Ver todos los cupones
              </button>
            </div>
          )}

          {!loadingPromos && !errorPromos && displayedPromos.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayedPromos.slice(0, visiblePromoLimit).map((promo) => (
                  <CouponCard
                    key={promo.id}
                    promo={promo}
                    isFavorite={favoriteIds.includes(promo.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onSelect={(p) => setSelected(p)}
                  />
                ))}
              </div>
              {(displayedPromos.length > visiblePromoLimit || (hasMorePromos && !showFavoritesOnly) || visiblePromoLimit > 4) && (
                <div className="flex items-center justify-center gap-3 pt-1">
                  <div className="h-px flex-1 bg-surface-border max-w-[140px]" />
                  {(displayedPromos.length > visiblePromoLimit || (hasMorePromos && !showFavoritesOnly)) && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextLimit = visiblePromoLimit + 4;
                        setVisiblePromoLimit(nextLimit);
                        if (nextLimit > displayedPromos.length && hasMorePromos && !loadingMorePromos) {
                          handleLoadMorePromotions();
                        }
                      }}
                      disabled={loadingMorePromos}
                      className="inline-flex items-center gap-2 bg-white hover:bg-surface-muted disabled:opacity-50 text-content-primary font-semibold text-xs px-5 py-2 rounded-full border border-surface-border hover:border-brand-300 transition-all shadow-subtle"
                    >
                      <span>
                        {loadingMorePromos
                          ? "Cargando..."
                          : `Ver más cupones${
                              displayedPromos.length > visiblePromoLimit
                                ? ` (${displayedPromos.length - visiblePromoLimit} más)`
                                : ""
                            }`}
                      </span>
                      <span className="text-brand-600 text-xs">↓</span>
                    </button>
                  )}
                  {visiblePromoLimit > 4 && (
                    <button
                      type="button"
                      onClick={() => setVisiblePromoLimit(4)}
                      className="inline-flex items-center gap-1.5 text-content-secondary hover:text-content-primary font-medium text-xs px-3 py-2 rounded-full transition-colors"
                    >
                      <span>Ver menos ↑</span>
                    </button>
                  )}
                  <div className="h-px flex-1 bg-surface-border max-w-[140px]" />
                </div>
              )}
            </>
          )}
        </section>

        {/* ── SELECCIONES CURADAS (ESTILO RESY: POPULARES · MEJOR VALORADOS · NUEVOS) ── */}
        {!loadingRest && !errorRest && restaurants.length > 0 && (
          <CuratedListsSection
            restaurants={restaurants}
            promotions={promotions}
            favoriteRestaurantIds={favoriteRestaurantIds}
            onToggleFavoriteRestaurant={handleToggleFavoriteRestaurant}
            onViewAllPopular={() => {
              fetchPromotions(undefined, undefined, undefined, true);
              document.getElementById("cupones")?.scrollIntoView({ behavior: "smooth" });
            }}
            onViewAllTopRated={() => {
              document.getElementById("restaurantes")?.scrollIntoView({ behavior: "smooth" });
            }}
            onViewAllNew={() => {
              document.getElementById("restaurantes")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        )}

        {/* ── RESTAURANTES ALIADOS ───────────────────────────────────────────── */}
        <section id="restaurantes" className="space-y-4 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
            <div>
              <h2 className="font-semibold tracking-tight text-content-primary text-xl">
                Restaurantes Aliados
              </h2>
              <p className="text-xs text-content-secondary mt-0.5">
                Establecimientos certificados por CupOn
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleToggleNearby}
                disabled={locatingUser}
                aria-pressed={Boolean(userCoords)}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium border transition-colors whitespace-nowrap ${
                  userCoords
                    ? "bg-content-primary border-content-primary text-white shadow-subtle"
                    : "bg-white text-content-secondary border-surface-border hover:bg-surface-muted shadow-subtle"
                }`}
              >
                <IconMapPin size={14} />
                <span>{locatingUser ? "Ubicando..." : userCoords ? "Cerca de mí ✓" : "Cerca de mí"}</span>
              </button>

              <select
                id="restaurant-cuisine-filter"
                aria-label="Filtrar por tipo de cocina"
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="bg-white border border-surface-border rounded-button px-3 py-1.5 text-xs text-content-primary outline-none focus:border-brand-500 shadow-subtle cursor-pointer"
              >
                <option value="">Todas las cocinas</option>
                <option value="Hamburguesas">Hamburguesas</option>
                <option value="Pizza">Pizza</option>
                <option value="Sushi">Sushi</option>
                <option value="Mexicana">Mexicana</option>
                <option value="Café">Café</option>
                <option value="Postres">Postres</option>
                <option value="Parrilla">Parrilla</option>
                <option value="Italiana">Italiana</option>
              </select>

              <div className="w-full sm:w-64">
                <input
                  id="restaurant-search-input"
                  type="text"
                  placeholder="Buscar por local o descripción..."
                  value={restaurantSearch}
                  onChange={(e) => setRestaurantSearch(e.target.value)}
                  className="w-full bg-white border border-surface-border rounded-button px-3 py-1.5 text-xs text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500 shadow-subtle"
                />
              </div>
            </div>
          </div>

          {geoError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-button">
              {geoError}
            </div>
          )}

          {loadingRest && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-surface-card border border-surface-border rounded-card p-4 animate-pulse space-y-3"
                >
                  <div className="aspect-[16/9] bg-surface-muted rounded-button w-full"></div>
                  <div className="h-4 bg-surface-muted rounded w-2/3"></div>
                  <div className="h-3 bg-surface-muted rounded w-full"></div>
                </div>
              ))}
            </div>
          )}

          {errorRest && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-card">
              {errorRest}
            </div>
          )}

          {!loadingRest && !errorRest && displayedRestaurants.length === 0 && (
            <div className="bg-surface-card border border-surface-border rounded-card p-8 text-center">
              <p className="text-xs text-content-secondary">
                No encontramos locales que coincidan con los filtros aplicados.
              </p>
            </div>
          )}

          {!loadingRest && !errorRest && displayedRestaurants.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedRestaurants.map((restaurant) => {
                const distanceKm =
                  userCoords && restaurant.latitude != null && restaurant.longitude != null
                    ? haversineKm(userCoords.lat, userCoords.lng, restaurant.latitude, restaurant.longitude)
                    : null;
                const activePromoCount = promotions.filter((p) => p.restaurantId === restaurant.id).length;
                return (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    isFavorite={favoriteRestaurantIds.includes(restaurant.id)}
                    distanceKm={distanceKm}
                    activePromoCount={activePromoCount}
                    onToggleFavorite={handleToggleFavoriteRestaurant}
                    onFilterPromotions={(name) => {
                      setSearchTerm(name);
                      fetchPromotions(name);
                      document.getElementById("cupones")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* ── BANNER PARA PROPIETARIOS DE RESTAURANTE ────────────────────────── */}
        <section className="bg-brand-50 border border-brand-200 rounded-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-subtle">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-semibold text-content-primary text-lg">
              ¿Eres propietario de un café o restaurante?
            </h3>
            <p className="text-xs text-content-secondary max-w-xl">
              Publica promociones exclusivas, atrae clientes recurrentes entre semana y optimiza la capacidad de tus mesas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/register/restaurant")}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-button transition-colors whitespace-nowrap shadow-subtle"
          >
            Afiliar mi negocio a CupOn →
          </button>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <Footer />

      {/* ── MODAL DETALLE DE CUPÓN ─────────────────────────────────────────── */}
      {selected && (
        <CouponDetailModal
          promo={selected}
          isFavorite={favoriteIds.includes(selected.id)}
          onClose={handleCloseDetail}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
}
