import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPromotions, toggleFavorite, getMyFavorites, getCategories } from "@/api/promotionServices";
import { getRestaurants } from "@/api/restaurantServices";
import type { Category, Promotion, Restaurant } from "@/types";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CouponCard from "./components/CouponCard";
import RestaurantCard from "./components/RestaurantCard";
import CouponDetailModal from "./components/CouponDetailModal";

// Nombre de categoría (seed V1 / DataSeeder) → emoji. Las no listadas usan 🍽️.
const CATEGORY_EMOJIS: Record<string, string> = {
  "Comida Rápida": "🍔",
  "Comida Mexicana": "🌮",
  Sushi: "🍣",
  Postres: "🍰",
  Bebidas: "☕",
  "Comida Saludable": "🥗",
  Italiana: "🍕",
  Mariscos: "🦐",
};

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

  // Sesión
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("cupon_user") || "null");
    } catch {
      return null;
    }
  });

  // Promociones
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [errorPromos, setErrorPromos] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeDay, setActiveDay] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Restaurantes
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRest, setLoadingRest] = useState(true);
  const [errorRest, setErrorRest] = useState<string | null>(null);
  const [restaurantSearch, setRestaurantSearch] = useState("");

  // Favoritos
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cupon_favorites") || "[]");
    } catch {
      return [];
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Modal detalle
  const [selected, setSelected] = useState<Promotion | null>(null);

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchPromotions();
    fetchRestaurants();
    getCategories()
      .then(setCategories)
      .catch(() => {});

    // Sincronizar favoritos si hay sesión de cliente
    if (currentUser?.role === "ROLE_CLIENTE") {
      getMyFavorites(0, 100)
        .then((d) => setFavoriteIds((d.content || []).map((p) => p.id)))
        .catch(() => {});
    }

    // Redirigir según rol
    if (currentUser?.role === "ROLE_RESTAURANTE") {
      navigate("/restaurant");
      return;
    }
    if (currentUser?.role === "ROLE_ADMIN") {
      navigate("/admin");
      return;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPromotions = (query?: string, day?: string, categoryId?: string) => {
    setLoadingPromos(true);
    setErrorPromos(null);
    const q = query !== undefined ? query : activeSearch;
    const dow = day !== undefined ? day : activeDay;
    const cat = categoryId !== undefined ? categoryId : activeCategory;
    getPromotions(q || undefined, 0, 16, dow || undefined, cat || undefined)
      .then((d) => {
        setPromotions(d.content);
        setActiveSearch(q || "");
        setActiveDay(dow || "");
        setActiveCategory(cat || "");
      })
      .catch(() => setErrorPromos("No se pudieron cargar los cupones."))
      .finally(() => setLoadingPromos(false));
  };

  const fetchRestaurants = () => {
    setLoadingRest(true);
    getRestaurants(0, 9)
      .then((d) => setRestaurants(d.content))
      .catch(() => setErrorRest("No se pudieron cargar los restaurantes aliados."))
      .finally(() => setLoadingRest(false));
  };

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cupon_user");
    setCurrentUser(null);
  };

  const activeCategoryName = categories.find((c) => c.id === activeCategory)?.name;

  const displayedPromos = showFavoritesOnly
    ? promotions.filter((p) => favoriteIds.includes(p.id))
    : promotions;

  const filteredRestaurants = restaurantSearch.trim()
    ? restaurants.filter(
        (r) =>
          r.businessName.toLowerCase().includes(restaurantSearch.toLowerCase()) ||
          r.address.toLowerCase().includes(restaurantSearch.toLowerCase())
      )
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
        {/* ── HERO SECTION EDITORIAL ─────────────────────────────────────────── */}
        <section
          id="inicio"
          className="relative bg-surface-card border border-surface-border rounded-card shadow-subtle p-6 sm:p-10 lg:p-12 overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 bg-accent-50 border border-accent-100 text-accent-700 text-xs font-semibold px-3 py-1 rounded-full">
                <span>✨</span>
                <span>Hospitalidad y gastronomía selecta</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-content-primary leading-[1.15]">
                La semana sabe mejor con <span className="text-brand-600">CupOn</span>.
              </h1>

              <p className="text-content-secondary text-sm sm:text-base max-w-xl leading-relaxed">
                Descubre descuentos exclusivos en tus restaurantes, cafés y bistrós preferidos. Válidos de lunes a jueves para que disfrutes cada día como el fin de semana.
              </p>

              {/* Formulario de Búsqueda */}
              <form onSubmit={handleSearch} className="pt-2 max-w-lg">
                <div className="flex items-center gap-2 bg-white border border-surface-border p-1.5 rounded-card shadow-subtle focus-within:border-brand-500 transition-colors">
                  <span className="text-content-muted pl-2 text-sm">🔍</span>
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
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button text-sm border whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-brand-600 border-brand-600 text-white font-medium shadow-subtle"
                      : "bg-white hover:bg-surface-muted text-content-secondary border-surface-border font-normal"
                  }`}
                >
                  <span>{CATEGORY_EMOJIS[cat.name] || "🍽️"}</span>
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
                  className={`px-3 py-1 rounded-button text-xs border whitespace-nowrap transition-colors ${
                    isActive
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-toggle-favorites"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium border transition-colors ${
                  showFavoritesOnly
                    ? "bg-brand-50 text-brand-700 border-brand-200"
                    : "bg-white text-content-secondary border-surface-border hover:bg-surface-muted"
                }`}
              >
                <span>{showFavoritesOnly ? "❤️" : "🤍"}</span>
                <span>Solo mis favoritos</span>
                {favoriteIds.length > 0 && (
                  <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
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
              <span className="text-3xl block mb-2">{showFavoritesOnly ? "❤️" : "🔍"}</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedPromos.map((promo) => (
                <CouponCard
                  key={promo.id}
                  promo={promo}
                  isFavorite={favoriteIds.includes(promo.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onSelect={(p) => setSelected(p)}
                />
              ))}
            </div>
          )}
        </section>

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

            <div className="w-full sm:w-64">
              <input
                id="restaurant-search-input"
                type="text"
                placeholder="Buscar por local o zona..."
                value={restaurantSearch}
                onChange={(e) => setRestaurantSearch(e.target.value)}
                className="w-full bg-white border border-surface-border rounded-button px-3 py-1.5 text-xs text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500 shadow-subtle"
              />
            </div>
          </div>

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

          {!loadingRest && !errorRest && filteredRestaurants.length === 0 && (
            <div className="bg-surface-card border border-surface-border rounded-card p-8 text-center">
              <p className="text-xs text-content-secondary">
                No encontramos locales que coincidan con "{restaurantSearch}".
              </p>
            </div>
          )}

          {!loadingRest && !errorRest && filteredRestaurants.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onFilterPromotions={(name) => {
                    setSearchTerm(name);
                    fetchPromotions(name);
                    document.getElementById("cupones")?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              ))}
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
          onClose={() => setSelected(null)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
}
