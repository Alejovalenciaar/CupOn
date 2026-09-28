import { useState, useEffect } from "react";
import { getPromotionById } from "@/api/promotionServices";
import { Promotion } from "@/types";

/**
 * FavoritesPage – HU 15
 * Muestra las promociones guardadas por el usuario (almacenadas en localStorage).
 * Permite quitarlas de favoritos directamente desde esta vista.
 */
export default function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("cupon_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Cargar los detalles de cada promoción favorita
  useEffect(() => {
    if (favoriteIds.length === 0) {
      setLoading(false);
      setPromotions([]);
      return;
    }

    setLoading(true);
    const fetchAll = async () => {
      const results: Promotion[] = [];
      const errs: string[] = [];

      await Promise.allSettled(
        favoriteIds.map(async (id) => {
          try {
            const promo = await getPromotionById(id);
            results.push(promo);
          } catch {
            errs.push(id);
          }
        })
      );

      setPromotions(results);
      setErrors(errs);
      setLoading(false);
    };

    fetchAll();
  }, [favoriteIds]);

  const handleRemoveFavorite = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      const updated = favoriteIds.filter((fid) => fid !== id);
      setFavoriteIds(updated);
      localStorage.setItem("cupon_favorites", JSON.stringify(updated));
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      setRemovingId(null);
    }, 300);
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

  if (favoriteIds.length === 0) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <div style={{ fontSize: 72 }}>🤍</div>
          <h2 className="fw-bold mt-3">No tienes favoritos guardados</h2>
          <p className="text-muted">
            Explora el catálogo y guarda los cupones que más te gusten tocando el ❤️
          </p>
          <a href="/" className="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-sm"
            style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)", border: "none" }}
          >
            Explorar cupones
          </a>
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
        <a href="/" className="btn btn-outline-dark rounded-pill px-4 fw-semibold">
          ← Volver al catálogo
        </a>
      </div>

      {errors.length > 0 && (
        <div className="alert alert-warning rounded-4 small mb-4" role="alert">
          ⚠️ No se pudieron cargar {errors.length} cupón(es). Puede que hayan vencido o sido eliminados.
        </div>
      )}

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
                    className="position-absolute bottom-0 end-0 m-2 btn btn-danger btn-sm rounded-pill px-2 py-1 shadow-sm"
                    title="Quitar de favoritos"
                    style={{ fontSize: "0.75rem" }}
                    aria-label={`Quitar ${promotion.title} de favoritos`}
                  >
                    ❤️ Quitar
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
