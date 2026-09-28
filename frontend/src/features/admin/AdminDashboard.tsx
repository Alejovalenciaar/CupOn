import { useState, useEffect } from "react";
import { Restaurant, Promotion, SystemMetrics } from "@/types";
import { getSystemMetrics, getPendingRestaurants, approveRestaurant, deletePromotionByAdmin } from "@/api/adminServices";
import { getRestaurants } from "@/api/restaurantServices";
import { getPromotions } from "@/api/promotionServices";

interface AdminDashboardProps {
  currentUser?: { email: string; role: string };
  onLogout?: () => void;
  onSwitchToCustomerView?: () => void;
  onCatalogNeedsRefresh?: () => void;
}

export default function AdminDashboard({
  currentUser,
  onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cupon_user");
    window.location.href = "/";
  },
  onSwitchToCustomerView = () => {
    window.location.href = "/";
  },
  onCatalogNeedsRefresh,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"metrics" | "pending" | "restaurants" | "moderation">("metrics");
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [pendingRestaurants, setPendingRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [allPromotions, setAllPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    setActionMessage(null);
    setActionError(null);

    try {
      const [metricsData, pendingData, restaurantsData, promotionsData] = await Promise.all([
        getSystemMetrics(),
        getPendingRestaurants(0, 50),
        getRestaurants(0, 50),
        getPromotions(undefined, 0, 50),
      ]);

      setMetrics(metricsData);
      setPendingRestaurants(pendingData.content || []);
      setAllRestaurants(restaurantsData.content || []);
      setAllPromotions(promotionsData.content || []);
    } catch (err: any) {
      console.error("Error al cargar datos de administración:", err);
      setActionError("Error al cargar la información del panel administrativo.");
    } finally {
      setLoading(false);
    }
  };

  // Aprobar o rechazar restaurante (HU 6.1)
  const handleApprove = async (restaurantId: string, approved: boolean) => {
    const reason = approved ? undefined : prompt("Indica el motivo del rechazo (opcional):") || undefined;
    try {
      await approveRestaurant(restaurantId, { approved, rejectionReason: reason });
      setActionMessage(approved ? "✅ Restaurante aprobado exitosamente." : "❌ Restaurante rechazado.");
      await loadAdminData();
      if (onCatalogNeedsRefresh) onCatalogNeedsRefresh();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al procesar la solicitud.");
    }
  };

  // Eliminar promocion por moderación (HU 6.4)
  const handleDeletePromotion = async (promotionId: string, title: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la promoción \"${title}\" por moderación?`)) {
      return;
    }

    try {
      await deletePromotionByAdmin(promotionId);
      setActionMessage("🗑️ Promoción eliminada por moderación administrativa.");
      await loadAdminData();
      if (onCatalogNeedsRefresh) onCatalogNeedsRefresh();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al eliminar la promoción.");
    }
  };

  return (
    <div style={{ backgroundColor: "#0f172a", minHeight: "100vh", color: "#f8fafc" }}>
      {/* NAVBAR SUPERADMIN */}
      <nav className="navbar navbar-expand-lg border-bottom border-secondary py-3 sticky-top" style={{ backgroundColor: "#1e293b" }}>
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center gap-3">
            <span
              className="d-flex align-items-center justify-content-center rounded-3 shadow text-white fw-bold"
              style={{ width: 42, height: 42, background: "linear-gradient(135deg, #ef4444, #f97316)", fontSize: 22 }}
            >
              🛡️
            </span>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold fs-5 text-white">CupOn Master Admin</span>
                <span className="badge bg-danger rounded-pill fw-bold" style={{ fontSize: "0.75rem", letterSpacing: 0.5 }}>
                  SUPERADMIN
                </span>
              </div>
              <small className="text-secondary" style={{ fontSize: "0.8rem" }}>
                Gestión Global de la Plataforma • Épica 6
              </small>
            </div>
          </div>

          {/* Selector de Pestañas */}
          <div className="d-flex align-items-center gap-2 my-2 my-lg-0 flex-wrap">
            <button
              onClick={() => setActiveTab("metrics")}
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeTab === "metrics" ? "btn-primary shadow" : "btn-outline-secondary text-light"}`}
            >
              📊 Métricas Generales (HU 6.5)
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`btn btn-sm rounded-pill px-3 fw-semibold position-relative ${activeTab === "pending" ? "btn-primary shadow" : "btn-outline-secondary text-light"}`}
            >
              ⏳ Solicitudes Pendientes
              {pendingRestaurants.length > 0 && (
                <span className="badge bg-danger rounded-pill ms-2">
                  {pendingRestaurants.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("restaurants")}
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeTab === "restaurants" ? "btn-primary shadow" : "btn-outline-secondary text-light"}`}
            >
              🏪 Directorio de Restaurantes (HU 6.2)
            </button>
            <button
              onClick={() => setActiveTab("moderation")}
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeTab === "moderation" ? "btn-primary shadow" : "btn-outline-secondary text-light"}`}
            >
              🎟️ Moderación de Cupones (HU 6.3 & 6.4)
            </button>
          </div>

          {/* Acciones */}
          <div className="d-flex align-items-center gap-2">
            {currentUser && (
              <span className="badge bg-dark text-secondary border border-secondary px-3 py-2 rounded-pill small me-1">
                👤 {currentUser.email}
              </span>
            )}
            <button
              onClick={onSwitchToCustomerView}
              className="btn btn-outline-info btn-sm rounded-pill px-3 fw-semibold"
            >
              👁️ Ver Marketplace
            </button>
            <button
              onClick={onLogout}
              className="btn btn-outline-danger btn-sm rounded-pill px-3"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="container py-4">
        {actionMessage && (
          <div className="alert alert-success border-0 shadow rounded-4 py-2 px-3 mb-4" role="alert">
            {actionMessage}
          </div>
        )}

        {actionError && (
          <div className="alert alert-danger border-0 shadow rounded-4 py-2 px-3 mb-4" role="alert">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info" role="status"></div>
            <p className="mt-2 text-secondary">Cargando métricas y registros de la plataforma...</p>
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* PESTAÑA 1: MÉTRICAS GENERALES DEL SISTEMA (HU 6.5) */}
            {/* ========================================================================= */}
            {activeTab === "metrics" && (
              <div>
                <div className="mb-4">
                  <h3 className="fw-bold text-white mb-1">Métricas Generales de CupOn</h3>
                  <p className="text-secondary mb-0">Monitoreo en tiempo real de usuarios, restaurantes y ofertas activas</p>
                </div>

                {/* 5 KPI CARDS */}
                <div className="row g-3 mb-4">
                  <div className="col-sm-6 col-lg">
                    <div className="card border-0 shadow rounded-4 p-3 h-100" style={{ backgroundColor: "#1e293b" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-secondary small fw-semibold">Usuarios Totales</span>
                        <span className="p-2 rounded-3 bg-primary-subtle text-primary fs-5">👥</span>
                      </div>
                      <div className="fs-2 fw-bold text-white">{metrics?.totalUsers || 0}</div>
                      <small className="text-secondary">Clientes y negocios registrados</small>
                    </div>
                  </div>

                  <div className="col-sm-6 col-lg">
                    <div className="card border-0 shadow rounded-4 p-3 h-100" style={{ backgroundColor: "#1e293b" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-secondary small fw-semibold">Restaurantes</span>
                        <span className="p-2 rounded-3 bg-success-subtle text-success fs-5">🏪</span>
                      </div>
                      <div className="fs-2 fw-bold text-success">{metrics?.totalRestaurants || 0}</div>
                      <small className="text-secondary">Establecimientos asociados</small>
                    </div>
                  </div>

                  <div className="col-sm-6 col-lg">
                    <div className="card border-0 shadow rounded-4 p-3 h-100" style={{ backgroundColor: "#1e293b" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-secondary small fw-semibold">Por Aprobar</span>
                        <span className="p-2 rounded-3 bg-warning-subtle text-warning fs-5">⏳</span>
                      </div>
                      <div className="fs-2 fw-bold text-warning">{metrics?.pendingApprovals || 0}</div>
                      <small className="text-secondary">En cola de validación</small>
                    </div>
                  </div>

                  <div className="col-sm-6 col-lg">
                    <div className="card border-0 shadow rounded-4 p-3 h-100" style={{ backgroundColor: "#1e293b" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-secondary small fw-semibold">Promociones Creadas</span>
                        <span className="p-2 rounded-3 bg-info-subtle text-info fs-5">🎟️</span>
                      </div>
                      <div className="fs-2 fw-bold text-info">{metrics?.totalPromotions || 0}</div>
                      <small className="text-secondary">Histórico de ofertas</small>
                    </div>
                  </div>

                  <div className="col-sm-6 col-lg">
                    <div className="card border-0 shadow rounded-4 p-3 h-100" style={{ backgroundColor: "#1e293b" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-secondary small fw-semibold">Ofertas Activas</span>
                        <span className="p-2 rounded-3 bg-danger-subtle text-danger fs-5">🔥</span>
                      </div>
                      <div className="fs-2 fw-bold text-white">{metrics?.activePromotions || 0}</div>
                      <small className="text-secondary">Disponibles en catálogo hoy</small>
                    </div>
                  </div>
                </div>

                {/* DIAGNÓSTICO DE SALUD DE LA PLATAFORMA */}
                <div className="card border-0 shadow rounded-4 p-4 mb-4" style={{ backgroundColor: "#1e293b" }}>
                  <h5 className="fw-bold text-white mb-3">Estado del Ecosistema CupOn</h5>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="p-3 rounded-4 border border-secondary" style={{ backgroundColor: "#0f172a" }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span>🟢</span>
                          <strong className="text-white">API Backend (Spring Boot)</strong>
                        </div>
                        <small className="text-secondary d-block">Servidor y controladores operando al 100%.</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-3 rounded-4 border border-secondary" style={{ backgroundColor: "#0f172a" }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span>🟢</span>
                          <strong className="text-white">Base de Datos PostgreSQL</strong>
                        </div>
                        <small className="text-secondary d-block">Persistencia transaccional íntegra y conectada.</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-3 rounded-4 border border-secondary" style={{ backgroundColor: "#0f172a" }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span>⚡</span>
                          <strong className="text-white">Caché Redis</strong>
                        </div>
                        <small className="text-secondary d-block">Aceleración de catálogos y serialización activa.</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PESTAÑA 2: APROBACIÓN DE RESTAURANTES (HU 6.1) */}
            {/* ========================================================================= */}
            {activeTab === "pending" && (
              <div>
                <div className="mb-4">
                  <h3 className="fw-bold text-white mb-1">Restaurantes Pendientes de Aprobación</h3>
                  <p className="text-secondary mb-0">Revisa la documentación y aprueba o rechaza los negocios que solicitan ingresar a CupOn</p>
                </div>

                {pendingRestaurants.length === 0 ? (
                  <div className="card border-0 shadow rounded-4 p-5 text-center" style={{ backgroundColor: "#1e293b" }}>
                    <span style={{ fontSize: "3rem" }}>🎉</span>
                    <h4 className="fw-bold text-white mt-3">¡Todo al día!</h4>
                    <p className="text-secondary mb-0">No hay restaurantes pendientes de aprobación en este momento.</p>
                  </div>
                ) : (
                  <div className="row g-4">
                    {pendingRestaurants.map((rest) => (
                      <div key={rest.id} className="col-md-6 col-lg-4">
                        <div className="card border-0 shadow rounded-4 overflow-hidden h-100" style={{ backgroundColor: "#1e293b" }}>
                          <div className="p-4 d-flex flex-column h-100">
                            <div className="d-flex align-items-center gap-3 mb-3">
                              {rest.logoUrl ? (
                                <img
                                  src={rest.logoUrl}
                                  alt="Logo"
                                  className="rounded-3"
                                  style={{ width: 56, height: 56, objectFit: "cover" }}
                                />
                              ) : (
                                <div
                                  className="rounded-3 d-flex align-items-center justify-content-center bg-warning text-dark fw-bold fs-4"
                                  style={{ width: 56, height: 56 }}
                                >
                                  🏪
                                </div>
                              )}
                              <div>
                                <h5 className="fw-bold text-white mb-1">{rest.businessName}</h5>
                                <span className="badge bg-warning text-dark rounded-pill fw-bold">PENDIENTE</span>
                              </div>
                            </div>

                            <div className="mb-3 text-secondary small flex-fill">
                              <p className="mb-1"><strong>Dueño / Contacto:</strong> {rest.ownerName}</p>
                              <p className="mb-1"><strong>Dirección:</strong> {rest.address}</p>
                              <p className="mb-1"><strong>Teléfono:</strong> {rest.phoneNumber || "No especificado"}</p>
                              <p className="mb-0"><strong>Descripción:</strong> {rest.description || "Sin descripción."}</p>
                            </div>

                            <div className="d-flex gap-2 pt-3 border-top border-secondary">
                              <button
                                onClick={() => handleApprove(rest.id, true)}
                                className="btn btn-success flex-fill rounded-pill fw-bold btn-sm shadow"
                              >
                                ✅ Aprobar
                              </button>
                              <button
                                onClick={() => handleApprove(rest.id, false)}
                                className="btn btn-outline-danger flex-fill rounded-pill fw-bold btn-sm"
                              >
                                ❌ Rechazar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* PESTAÑA 3: DIRECTORIO DE RESTAURANTES (HU 6.2) */}
            {/* ========================================================================= */}
            {activeTab === "restaurants" && (
              <div>
                <div className="mb-4">
                  <h3 className="fw-bold text-white mb-1">Directorio de Establecimientos</h3>
                  <p className="text-secondary mb-0">Restaurantes activos en la plataforma con control de acceso</p>
                </div>

                <div className="card border-0 shadow rounded-4 overflow-hidden" style={{ backgroundColor: "#1e293b" }}>
                  <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0" style={{ backgroundColor: "#1e293b" }}>
                      <thead>
                        <tr className="border-secondary text-secondary small">
                          <th className="py-3 px-4">RESTAURANTE</th>
                          <th className="py-3">DIRECCIÓN</th>
                          <th className="py-3">TELÉFONO</th>
                          <th className="py-3">ESTADO</th>
                          <th className="py-3 text-end px-4">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allRestaurants.map((rest) => (
                          <tr key={rest.id} className="border-secondary align-middle">
                            <td className="py-3 px-4">
                              <div className="d-flex align-items-center gap-3">
                                {rest.logoUrl ? (
                                  <img
                                    src={rest.logoUrl}
                                    alt="Logo"
                                    className="rounded-3"
                                    style={{ width: 40, height: 40, objectFit: "cover" }}
                                  />
                                ) : (
                                  <div
                                    className="rounded-3 d-flex align-items-center justify-content-center bg-secondary text-white fw-bold"
                                    style={{ width: 40, height: 40 }}
                                  >
                                    🍽️
                                  </div>
                                )}
                                <div>
                                  <strong className="text-white d-block">{rest.businessName}</strong>
                                  <small className="text-secondary">{rest.ownerName}</small>
                                </div>
                              </div>
                            </td>
                            <td className="text-light small">{rest.address}</td>
                            <td className="text-light small">{rest.phoneNumber || "—"}</td>
                            <td>
                              <span className="badge bg-success rounded-pill px-3 py-1">APROBADO</span>
                            </td>
                            <td className="text-end px-4">
                              <button
                                onClick={() => alert("Restaurante validado y operando con normalidad.")}
                                className="btn btn-outline-info btn-sm rounded-pill px-3"
                              >
                                Ver Detalles
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PESTAÑA 4: MODERACIÓN DE CUPONES (HU 6.3 & HU 6.4) */}
            {/* ========================================================================= */}
            {activeTab === "moderation" && (
              <div>
                <div className="mb-4">
                  <h3 className="fw-bold text-white mb-1">Moderación de Promociones de la Plataforma</h3>
                  <p className="text-secondary mb-0">Supervisa las ofertas vigentes y elimina cualquier contenido engañoso o inapropiado (HU 6.3 & HU 6.4)</p>
                </div>

                <div className="row g-4">
                  {allPromotions.map((promo) => (
                    <div key={promo.id} className="col-md-6 col-lg-4">
                      <div className="card border-0 shadow rounded-4 overflow-hidden h-100" style={{ backgroundColor: "#1e293b" }}>
                        <div className="position-relative">
                          <img
                            src={promo.imageUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop"}
                            alt={promo.title}
                            style={{ width: "100%", height: 160, objectFit: "cover" }}
                          />
                          <span className="position-absolute badge bg-dark text-white rounded-pill px-3 py-1" style={{ top: 12, left: 12 }}>
                            {promo.restaurantName}
                          </span>
                          <span className="position-absolute badge bg-danger text-white rounded-pill px-3 py-1 fw-bold" style={{ top: 12, right: 12 }}>
                            {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}% OFF` : `$${promo.discountValue.toLocaleString()}`}
                          </span>
                        </div>

                        <div className="p-4 d-flex flex-column flex-fill">
                          <div className="badge bg-secondary-subtle text-light border border-secondary font-monospace align-self-start mb-2 px-3 py-1">
                            🏷️ {promo.code}
                          </div>
                          <h6 className="fw-bold text-white mb-2">{promo.title}</h6>
                          <p className="text-secondary small flex-fill mb-3" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {promo.description || "Sin descripción."}
                          </p>

                          <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary">
                            <span className="small text-secondary">
                              Canjes: <strong className="text-light">{promo.currentRedemptions || 0}/{promo.maxRedemptions || "∞"}</strong>
                            </span>
                            <button
                              onClick={() => handleDeletePromotion(promo.id, promo.title)}
                              className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-semibold shadow-sm"
                              title="Eliminar por moderación administrativa (HU 6.4)"
                            >
                              🗑️ Eliminar Contenido
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
