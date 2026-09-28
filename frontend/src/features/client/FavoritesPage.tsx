/**
 * FavoritesPage — HU 15: Mis cupones favoritos
 * Muestra las promociones guardadas como favorito por el cliente autenticado.
 * Si hay sesión de ROLE_CLIENTE activa, carga desde el backend.
 * Si no hay sesión, usa localStorage como fallback.
 */
import { useState, useEffect } from "react";
import { getMyFavorites, toggleFavorite } from "@/api/promotionServices";
import { Promotion } from "@/types";

interface FavoritesPageProps {
  onBack?: () => void;
}

export default function FavoritesPage({ onBack }: FavoritesPageProps = {}) {
  // Detectar si hay un cliente autenticado
  const isClient = (() => {
    try {
      const saved = localStorage.getItem("cupon_user");
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      return parsed.role === "ROLE_CLIENTE";
    } catch {
      return false;
    }
  })();

  // Fallback: favoriteIds locales (para usuarios no autenticados)
  const [localFavoriteIds, setLocalFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("cupon_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Cargar favoritos desde el backend o localStorage
  useEffect(() => {
    setLoading(true);
    setError(null);

    if (isClient) {
      // Cargar desde el backend
      getMyFavorites(0, 50)
        .then((data) => {
          setPromotions(data.content || []);
        })
        .catch((err) => {
          console.error("Error al cargar favoritos:", err);
          setError("No se pudieron cargar tus favoritos. Intenta de nuevo.");
        })
        .finally(() => setLoading(false));
    } else {
      // Sin sesión: mostrar mensaje de acceso requerido
      setLoading(false);
    }
  }, [isClient]);

  const handleRemoveFavorite = async (id: string) => {
    setRemovingId(id);
    try {
      if (isClient) {
        // Remover en el backend
        await toggleFavorite(id);
      } else {
        // Remover en localStorage
        const updated = localFavoriteIds.filter((fid) => fid !== id);
        setLocalFavoriteIds(updated);
        localStorage.setItem("cupon_favorites", JSON.stringify(updated));
      }
      // Animar salida
      setTimeout(() => {
        setPromotions((prev) => prev.filter((p) => p.id !== id));
        setRemovingId(null);
      }, 300);
    } catch (err) {
      console.error("Error al quitar favorito:", err);
      setRemovingId(null);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-danger" role="status" aria-label="Cargando favoritos" />
        <p className="mt-3 text-muted">Cargando tus cupones favoritos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger rounded-4" role="alert">
          ❌ {error}
        </div>
        <button onClick={() => onBack?.()} className="btn btn-outline-dark rounded-pill px-4 fw-semibold">
          ← Volver al catálogo
        </button>
      </div>
    );
  }

  // Usuario no autenticado como cliente
  if (!isClient) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <div style={{ fontSize: 72 }}>🔒</div>
          <h2 className="fw-bold mt-3">Inicia sesión para ver tus favoritos</h2>
          <p className="text-muted">
            Necesitas una cuenta de cliente para guardar y ver tus cupones favoritos.
          </p>
          <button
            onClick={() => onBack?.()}
            className="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-sm"
            style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)", border: "none" }}
          >
            Volver e iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <div style={{ fontSize: 72 }}>🤍</div>
          <h2 className="fw-bold mt-3">No tienes favoritos guardados</h2>
          <p className="text-muted">
            Explora el catálogo y guarda los cupones que más te gusten tocando el ❤️
          </p>
          <button
            onClick={() => onBack?.()}
            className="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-sm"
            style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)", border: "none" }}
          >
            Explorar cupones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Cabecera */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-0">
            ❤️ Mis Favoritos
          </h2>
          <small className="text-muted">
            {promotions.length} cupón{promotions.length !== 1 ? "es" : ""} guardado{promotions.length !== 1 ? "s" : ""}
          </small>
        </div>
        <button onClick={() => onBack?.()} className="btn btn-outline-dark rounded-pill px-4 fw-semibold">
          ← Volver al catálogo
        </button>
      </div>

      {/* Grid de cupones favoritos */}
      <div className="row g-4">
        {promotions.map((promotion) => {
          const isRemoving = removingId === promotion.id;
          const isExpired = new Date(promotion.endDate) < new Date();

          return (
            <div
              key={promotion.id}
              className="col-12 col-md-6 col-lg-4"
              style={{
                transition: "opacity 0.3s, transform 0.3s",
                opacity: isRemoving ? 0 : 1,
                transform: isRemoving ? "scale(0.95)" : "scale(1)",
              }}
            >
              <div className={`card h-100 border-0 shadow-sm rounded-4 overflow-hidden ${isExpired ? "opacity-75" : ""}`}>
                {/* Imagen */}
                <div className="position-relative">
                  <img
                    src={promotion.imageUrl || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=250&fit=crop"}
                    className="card-img-top"
                    style={{ height: 160, objectFit: "cover", filter: isExpired ? "grayscale(0.5)" : "none" }}
                    alt={promotion.title}
                  />

                  {/* Badge descuento */}
                  <span
                    className="position-absolute top-0 end-0 m-2 badge rounded-pill text-white fw-bold px-3 py-2 shadow-sm"
                    style={{ background: isExpired ? "#aaa" : "#ff5a1f", fontSize: "0.85rem" }}
                  >
                    {promotion.discountType === "PERCENTAGE"
                      ? `-${promotion.discountValue}%`
                      : `-$${Number(promotion.discountValue).toLocaleString()}`}
                  </span>

                  {/* Badge expirado */}
                  {isExpired && (
                    <span className="position-absolute top-0 start-0 m-2 badge bg-secondary rounded-pill px-2 py-1" style={{ fontSize: "0.75rem" }}>
                      Vencido
                    </span>
                  )}

                  {/* Botón quitar favorito */}
                  <button
                    onClick={() => handleRemoveFavorite(promotion.id)}
                    disabled={!!removingId}
                    className="position-absolute bottom-0 end-0 m-2 btn btn-danger btn-sm rounded-pill px-2 py-1 shadow-sm"
                    title="Quitar de favoritos"
                    style={{ fontSize: "0.75rem" }}
                    aria-label={`Quitar ${promotion.title} de favoritos`}
                  >
                    {removingId === promotion.id ? "..." : "❤️ Quitar"}
                  </button>
                </div>

                {/* Cuerpo */}
                <div className="card-body d-flex flex-column">
                  <div className="text-primary fw-semibold small mb-1">{promotion.restaurantName}</div>
                  <h6 className="fw-bold mb-1">{promotion.title}</h6>
                  <p className="text-muted small mb-2 flex-grow-1">{promotion.description}</p>

                  {/* Validez */}
                  <p className={`small mb-2 ${isExpired ? "text-danger" : "text-muted"}`}>
                    🕒 {isExpired ? "Venció el" : "Válido hasta"}:{" "}
                    {new Date(promotion.endDate).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  {/* Código de cupón */}
                  <div className="d-flex align-items-center justify-content-between bg-light rounded-3 p-2 mb-3">
                    <span className="small text-secondary fw-semibold">Código:</span>
                    <button
                      className="btn btn-link p-0 text-dark fw-bold font-monospace text-decoration-none"
                      title="Copiar código"
                      onClick={() => handleCopyCode(promotion.code)}
                      aria-label={`Copiar código ${promotion.code}`}
                    >
                      <code>{promotion.code}</code> 📋
                    </button>
                  </div>

                  {promotion.minPurchase > 0 && (
                    <p className="small text-muted mb-2">
                      💰 Compra mínima: ${promotion.minPurchase.toLocaleString()} COP
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
