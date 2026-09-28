import { useState, useEffect } from "react";
import { Restaurant, Promotion, CreatePromotionRequest, UpdateRestaurantRequest } from "@/types";
import { getMyRestaurant, updateMyRestaurant } from "@/api/restaurantServices";
import { getMyPromotions, createPromotion, updatePromotion, deletePromotion, updatePromotionStatus } from "@/api/promotionServices";

interface RestaurantDashboardProps {
  currentUser?: { email: string; role: string };
  onLogout?: () => void;
  onSwitchToCustomerView?: () => void;
  onCatalogNeedsRefresh?: () => void;
}

export default function RestaurantDashboard({
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
}: RestaurantDashboardProps) {
  const [activeTab, setActiveTab] = useState<"metrics" | "promotions" | "profile">("metrics");
  const [restaurantData, setRestaurantData] = useState<Restaurant | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Formulario de edición del restaurante (HU 3.2)
  const [profileForm, setProfileForm] = useState<UpdateRestaurantRequest>({
    businessName: "",
    description: "",
    address: "",
    phoneNumber: "",
    logoUrl: "",
  });

  // Modal para Crear / Editar Promoción (Épica 4)
  const [isPromoModalOpen, setIsPromoModalOpen] = useState<boolean>(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoSaving, setPromoSaving] = useState<boolean>(false);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [copiedPromoId, setCopiedPromoId] = useState<string | null>(null);

  const [promoForm, setPromoForm] = useState<CreatePromotionRequest>({
    title: "",
    description: "",
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minPurchase: 0,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    maxRedemptions: 100,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop",
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [restData, promoData] = await Promise.all([
        getMyRestaurant(),
        getMyPromotions(0, 50),
      ]);
      setRestaurantData(restData);
      setPromotions(promoData.content);
      setProfileForm({
        businessName: restData.businessName || "",
        description: restData.description || "",
        address: restData.address || "",
        phoneNumber: restData.phoneNumber || "",
        logoUrl: restData.logoUrl || "",
      });
    } catch (err) {
      console.error("Error cargando dashboard del restaurante:", err);
    } finally {
      setLoading(false);
    }
  };

  // Guardar Cambios del Perfil (HU 3.2)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const updated = await updateMyRestaurant(profileForm);
      setRestaurantData(updated);
      setProfileMessage("¡Información del restaurante actualizada exitosamente!");
      if (onCatalogNeedsRefresh) onCatalogNeedsRefresh();
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || "Error al actualizar los datos.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Abrir Modal para Crear
  const handleOpenCreatePromo = () => {
    setEditingPromoId(null);
    setPromoError(null);
    setPromoMessage(null);
    setPromoForm({
      title: "",
      description: "",
      code: "",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minPurchase: 0,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      maxRedemptions: 100,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop",
    });
    setIsPromoModalOpen(true);
  };

  // Abrir Modal para Editar
  const handleOpenEditPromo = (promo: Promotion) => {
    setEditingPromoId(promo.id);
    setPromoError(null);
    setPromoMessage(null);
    setPromoForm({
      title: promo.title,
      description: promo.description || "",
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minPurchase: promo.minPurchase || 0,
      startDate: promo.startDate ? promo.startDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
      endDate: promo.endDate ? promo.endDate.slice(0, 16) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      maxRedemptions: promo.maxRedemptions || 100,
      imageUrl: promo.imageUrl || "",
    });
    setIsPromoModalOpen(true);
  };

  // Guardar Promoción (Crear o Editar)
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoSaving(true);
    setPromoError(null);
    setPromoMessage(null);

    const payload: CreatePromotionRequest = {
      ...promoForm,
      startDate: promoForm.startDate.length === 16 ? `${promoForm.startDate}:00` : promoForm.startDate,
      endDate: promoForm.endDate.length === 16 ? `${promoForm.endDate}:00` : promoForm.endDate,
    };

    try {
      if (editingPromoId) {
        await updatePromotion(editingPromoId, payload);
        setPromoMessage("¡Promoción actualizada exitosamente!");
      } else {
        await createPromotion(payload);
        setPromoMessage("¡Promoción creada exitosamente!");
      }

      const refreshed = await getMyPromotions(0, 50);
      setPromotions(refreshed.content);
      if (onCatalogNeedsRefresh) onCatalogNeedsRefresh();

      setTimeout(() => {
        setIsPromoModalOpen(false);
        setPromoMessage(null);
      }, 1500);
    } catch (err: any) {
      setPromoError(err.response?.data?.message || "Error al procesar la promoción.");
    } finally {
      setPromoSaving(false);
    }
  };

  // Activar / Pausar
  const handleToggleStatus = async (promo: Promotion) => {
    const nextStatus = promo.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      await updatePromotionStatus(promo.id, nextStatus);
      const refreshed = await getMyPromotions(0, 50);
      setPromotions(refreshed.content);
      if (onCatalogNeedsRefresh) onCatalogNeedsRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al cambiar el estado.");
    }
  };

  // Eliminar
  const handleDeletePromo = async (promoId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cupón?")) return;
    try {
      await deletePromotion(promoId);
      const refreshed = await getMyPromotions(0, 50);
      setPromotions(refreshed.content);
      if (onCatalogNeedsRefresh) onCatalogNeedsRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al eliminar.");
    }
  };

  // Compartir
  const handleSharePromo = (promo: Promotion) => {
    const shareUrl = `${window.location.origin}/?promo=${promo.id}`;
    if (navigator.share) {
      navigator.share({
        title: promo.title,
        text: `¡Cupón exclusivo de ${restaurantData?.businessName || "nuestro restaurante"}! Código: ${promo.code}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedPromoId(promo.id);
      setTimeout(() => setCopiedPromoId(null), 2500);
    }
  };

  // Cálculo de Métricas (Épica 5 - HU 5.1)
  const totalPromotions = promotions.length;
  const activePromotionsCount = promotions.filter((p) => p.status === "ACTIVE").length;
  const totalRedemptions = promotions.reduce((acc, p) => acc + (p.currentRedemptions || 0), 0);
  const totalMaxCapacity = promotions.reduce((acc, p) => acc + (p.maxRedemptions || 0), 0);
  const redemptionRate = totalMaxCapacity > 0 ? Math.round((totalRedemptions / totalMaxCapacity) * 100) : 0;
  const bestPromo = [...promotions].sort((a, b) => (b.currentRedemptions || 0) - (a.currentRedemptions || 0))[0];

  return (
    <div style={{ backgroundColor: "#f4f6fa", minHeight: "100vh" }}>
      {/* NAVBAR DEDICADO DEL PORTAL RESTAURANTE */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm py-2 sticky-top">
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center gap-3">
            {restaurantData?.logoUrl ? (
              <img
                src={restaurantData.logoUrl}
                alt="Logo"
                className="rounded-3 shadow-sm"
                style={{ width: 44, height: 44, objectFit: "cover" }}
              />
            ) : (
              <div
                className="d-flex align-items-center justify-content-center rounded-3 text-white fw-bold shadow-sm"
                style={{ width: 44, height: 44, background: "linear-gradient(135deg, #7b2ff7, #f2394a)", fontSize: 20 }}
              >
                🏪
              </div>
            )}
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold fs-5 text-dark">
                  {restaurantData?.businessName || "Panel de Restaurante"}
                </span>
                <span className="badge rounded-pill fw-semibold" style={{
                  backgroundColor: restaurantData?.approvalStatus === "APPROVED" ? "#eefcf3" : "#fef9e7",
                  color: restaurantData?.approvalStatus === "APPROVED" ? "#198754" : "#b78103",
                  border: `1px solid ${restaurantData?.approvalStatus === "APPROVED" ? "#c3e6cb" : "#ffeeba"}`,
                  fontSize: "0.75rem"
                }}>
                  {restaurantData?.approvalStatus === "APPROVED" ? "🟢 Verificado" : "🟡 Pendiente"}
                </span>
              </div>
              <small className="text-muted d-block" style={{ fontSize: "0.8rem" }}>
                Portal de Administración B2B • CupOn
              </small>
            </div>
          </div>

          {/* Selector de Pestañas */}
          <div className="d-flex align-items-center gap-2 my-2 my-lg-0">
            <button
              onClick={() => setActiveTab("metrics")}
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeTab === "metrics" ? "btn-dark shadow-sm" : "btn-light text-muted"}`}
            >
              📊 Métricas & Rendimiento
            </button>
            <button
              onClick={() => setActiveTab("promotions")}
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeTab === "promotions" ? "btn-dark shadow-sm" : "btn-light text-muted"}`}
            >
              🎟️ Mis Promociones ({totalPromotions})
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${activeTab === "profile" ? "btn-dark shadow-sm" : "btn-light text-muted"}`}
            >
              🏢 Perfil del Local
            </button>
          </div>

          {/* Acciones Rápidas y Salir */}
          <div className="d-flex align-items-center gap-2">
            {currentUser && (
              <span className="badge bg-light text-dark border px-3 py-2 rounded-pill small me-1">
                👤 {currentUser.email}
              </span>
            )}
            <button
              onClick={onSwitchToCustomerView}
              className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold d-flex align-items-center gap-1 shadow-sm"
              title="Ver el catálogo como un cliente"
            >
              👁️ Ver como Cliente
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

      {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
      <div className="container py-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Cargando la información de tu restaurante...</p>
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* PESTAÑA 1: MÉTRICAS Y RENDIMIENTO (ÉPICA 5 - HU 5.1) */}
            {/* ========================================================================= */}
            {activeTab === "metrics" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="fw-bold text-dark mb-1">Rendimiento de tus Ofertas</h3>
                    <p className="text-muted mb-0">Estadísticas en tiempo real de atracción y redención de clientes</p>
                  </div>
                  <button
                    onClick={handleOpenCreatePromo}
                    className="btn rounded-pill px-4 text-white fw-bold shadow-sm"
                    style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                  >
                    + Publicar Nuevo Cupón
                  </button>
                </div>

                {/* KPI CARDS */}
                <div className="row g-3 mb-4">
                  <div className="col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted small fw-semibold">Promociones Activas</span>
                        <span className="p-2 rounded-circle bg-primary-subtle text-primary fs-5">🎟️</span>
                      </div>
                      <div className="fs-2 fw-bold text-dark">{activePromotionsCount}</div>
                      <small className="text-muted">de {totalPromotions} promociones en total</small>
                    </div>
                  </div>

                  <div className="col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted small fw-semibold">Canjes Realizados</span>
                        <span className="p-2 rounded-circle bg-success-subtle text-success fs-5">👥</span>
                      </div>
                      <div className="fs-2 fw-bold text-success">{totalRedemptions}</div>
                      <small className="text-muted">clientes atraídos a tu local</small>
                    </div>
                  </div>

                  <div className="col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted small fw-semibold">Tasa de Redención</span>
                        <span className="p-2 rounded-circle bg-warning-subtle text-warning fs-5">📈</span>
                      </div>
                      <div className="fs-2 fw-bold text-dark">{redemptionRate}%</div>
                      <small className="text-muted">sobre el límite total de cupones</small>
                    </div>
                  </div>

                  <div className="col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted small fw-semibold">Top Cupón</span>
                        <span className="p-2 rounded-circle bg-info-subtle text-info fs-5">🏆</span>
                      </div>
                      <div className="fw-bold text-dark text-truncate" style={{ fontSize: "1.1rem" }}>
                        {bestPromo ? bestPromo.code : "Sin datos"}
                      </div>
                      <small className="text-muted text-truncate d-block">
                        {bestPromo ? `${bestPromo.currentRedemptions} canjes acumulados` : "Crea tu primera promoción"}
                      </small>
                    </div>
                  </div>
                </div>

                {/* DESGLOSE POR PROMOCIÓN CON BARRAS DE PROGRESO */}
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                  <h5 className="fw-bold mb-3">Progreso de Canjes por Cupón</h5>
                  {promotions.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      No hay cupones registrados para calcular métricas.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {promotions.map((promo) => {
                        const max = promo.maxRedemptions || 100;
                        const current = promo.currentRedemptions || 0;
                        const pct = Math.min(100, Math.round((current / max) * 100));

                        return (
                          <div key={promo.id} className="p-3 rounded-4 border bg-light">
                            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                              <div>
                                <span className="badge bg-white text-dark border font-monospace me-2">
                                  {promo.code}
                                </span>
                                <span className="fw-bold text-dark">{promo.title}</span>
                                <span className="badge rounded-pill ms-2" style={{
                                  backgroundColor: promo.status === "ACTIVE" ? "#c3e6cb" : "#dee2e6",
                                  color: promo.status === "ACTIVE" ? "#155724" : "#495057",
                                }}>
                                  {promo.status === "ACTIVE" ? "Activa" : "Pausada"}
                                </span>
                              </div>
                              <span className="small fw-bold text-dark">
                                {current} / {max} canjes ({pct}%)
                              </span>
                            </div>
                            <div className="progress rounded-pill" style={{ height: 10 }}>
                              <div
                                className="progress-bar rounded-pill"
                                role="progressbar"
                                style={{
                                  width: `${pct}%`,
                                  background: pct > 80 ? "linear-gradient(90deg, #ff8a1f, #f2394a)" : "linear-gradient(90deg, #7b2ff7, #2f80ed)"
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* CONSEJO DE NEGOCIO */}
                <div className="card border-0 shadow-sm rounded-4 p-4 text-white" style={{ background: "linear-gradient(120deg, #7b2ff7 0%, #f107a3 100%)" }}>
                  <div className="d-flex align-items-center gap-3">
                    <span style={{ fontSize: "2.5rem" }}>💡</span>
                    <div>
                      <h5 className="fw-bold mb-1">Recomendación para aumentar tus ventas</h5>
                      <p className="mb-0" style={{ opacity: 0.95, fontSize: "0.95rem" }}>
                        Las promociones con porcentajes redondos (20%, 30% o 50% de descuento) y compras mínimas moderadas atraen hasta un 65% más de reservas y visitas en salón durante horas de la tarde.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PESTAÑA 2: GESTIÓN DE PROMOCIONES (ÉPICA 4) */}
            {/* ========================================================================= */}
            {activeTab === "promotions" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="fw-bold text-dark mb-1">Catálogo de Promociones de tu Negocio</h3>
                    <p className="text-muted mb-0">Crea, edita, pausa o comparte tus ofertas fácilmente</p>
                  </div>
                  <button
                    onClick={handleOpenCreatePromo}
                    className="btn rounded-pill px-4 text-white fw-bold shadow-sm"
                    style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                  >
                    + Crear Nueva Promoción
                  </button>
                </div>

                {promotions.length === 0 ? (
                  <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                    <span style={{ fontSize: "3rem" }}>🎟️</span>
                    <h4 className="fw-bold mt-3">No tienes promociones publicadas</h4>
                    <p className="text-muted mb-4">Crea una promoción atractiva para que los clientes de CupOn descubran tu comida.</p>
                    <button
                      onClick={handleOpenCreatePromo}
                      className="btn btn-primary rounded-pill px-4 fw-bold mx-auto"
                    >
                      Crear mi primera oferta
                    </button>
                  </div>
                ) : (
                  <div className="row g-4">
                    {promotions.map((promo) => (
                      <div key={promo.id} className="col-md-6 col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 bg-white d-flex flex-column">
                          <div className="position-relative">
                            <img
                              src={promo.imageUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop"}
                              alt={promo.title}
                              style={{ width: "100%", height: 180, objectFit: "cover" }}
                            />
                            <span
                              className="position-absolute badge rounded-pill px-3 py-2 fw-bold shadow-sm"
                              style={{
                                top: 12,
                                left: 12,
                                backgroundColor: promo.status === "ACTIVE" ? "#198754" : "#6c757d",
                                color: "#ffffff",
                              }}
                            >
                              {promo.status === "ACTIVE" ? "🟢 Activa" : "⚪ Pausada"}
                            </span>
                            <span
                              className="position-absolute badge bg-white text-danger fw-bold rounded-pill px-3 py-2 shadow-sm"
                              style={{ top: 12, right: 12, fontSize: "0.85rem" }}
                            >
                              {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}% OFF` : `$${promo.discountValue.toLocaleString()}`}
                            </span>
                          </div>

                          <div className="card-body p-4 d-flex flex-column flex-fill">
                            <div className="badge bg-light text-dark border font-monospace align-self-start mb-2 px-3 py-1">
                              🏷️ {promo.code}
                            </div>
                            <h5 className="fw-bold text-dark mb-2">{promo.title}</h5>
                            <p className="text-muted small flex-fill mb-3" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {promo.description || "Sin descripción adicional."}
                            </p>

                            <div className="bg-light p-2 rounded-3 mb-3 small d-flex justify-content-between text-muted">
                              <span>Canjes: <strong className="text-dark">{promo.currentRedemptions || 0}/{promo.maxRedemptions || "∞"}</strong></span>
                              <span>Mínimo: <strong className="text-dark">{promo.minPurchase ? `$${promo.minPurchase.toLocaleString()}` : "Ninguno"}</strong></span>
                            </div>

                            {/* Acciones */}
                            <div className="d-flex align-items-center gap-2 pt-2 border-top">
                              <button
                                onClick={() => handleToggleStatus(promo)}
                                className={`btn btn-sm flex-fill rounded-pill fw-semibold ${promo.status === "ACTIVE" ? "btn-outline-secondary" : "btn-outline-success"}`}
                              >
                                {promo.status === "ACTIVE" ? "⏸️ Pausar" : "▶️ Activar"}
                              </button>
                              <button
                                onClick={() => handleOpenEditPromo(promo)}
                                className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                title="Editar cupón"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleSharePromo(promo)}
                                className="btn btn-sm btn-outline-info rounded-pill px-3"
                                title="Compartir cupón"
                              >
                                {copiedPromoId === promo.id ? "✓" : "↗️"}
                              </button>
                              <button
                                onClick={() => handleDeletePromo(promo.id)}
                                className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                title="Eliminar cupón"
                              >
                                🗑️
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
            {/* PESTAÑA 3: PERFIL DEL LOCAL (ÉPICA 3 - HU 3.1 & HU 3.2) */}
            {/* ========================================================================= */}
            {activeTab === "profile" && (
              <div className="row justify-content-center">
                <div className="col-lg-8">
                  <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                    <h4 className="fw-bold mb-1">Información de tu Restaurante</h4>
                    <p className="text-muted small mb-4">Esta información es visible para los usuarios en el catálogo de CupOn</p>

                    {/* Estado de Aprobación */}
                    <div className="p-3 rounded-4 mb-4 border d-flex align-items-center gap-3" style={{
                      backgroundColor: restaurantData?.approvalStatus === "APPROVED" ? "#eefcf3" : "#fef9e7",
                      borderColor: restaurantData?.approvalStatus === "APPROVED" ? "#c3e6cb" : "#ffeeba"
                    }}>
                      <span style={{ fontSize: "2rem" }}>
                        {restaurantData?.approvalStatus === "APPROVED" ? "🟢" : "🟡"}
                      </span>
                      <div>
                        <div className="fw-bold text-dark">
                          Estado: {restaurantData?.approvalStatus === "APPROVED" ? "Aprobado y Activo" : "Pendiente de Validación"}
                        </div>
                        <small className="text-muted">
                          {restaurantData?.approvalStatus === "APPROVED"
                            ? "Tu restaurante está publicado en el catálogo público."
                            : "Tu local se encuentra en revisión comercial por el administrador."}
                        </small>
                      </div>
                    </div>

                    {profileMessage && (
                      <div className="alert alert-success rounded-4 py-2 small" role="alert">
                        {profileMessage}
                      </div>
                    )}

                    {profileError && (
                      <div className="alert alert-danger rounded-4 py-2 small" role="alert">
                        {profileError}
                      </div>
                    )}

                    <form onSubmit={handleSaveProfile}>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Nombre comercial</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          required
                          value={profileForm.businessName || ""}
                          onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                        />
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold">Dirección del local</label>
                          <input
                            type="text"
                            className="form-control rounded-3"
                            required
                            placeholder="Calle 100 # 15-20"
                            value={profileForm.address || ""}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold">Teléfono de atención</label>
                          <input
                            type="tel"
                            className="form-control rounded-3"
                            placeholder="+57 300 123 4567"
                            value={profileForm.phoneNumber || ""}
                            onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold">URL del Logo o Imagen representativa</label>
                        <input
                          type="url"
                          className="form-control rounded-3"
                          placeholder="https://images.unsplash.com/..."
                          value={profileForm.logoUrl || ""}
                          onChange={(e) => setProfileForm({ ...profileForm, logoUrl: e.target.value })}
                        />
                        {profileForm.logoUrl && (
                          <div className="mt-2 p-2 border rounded-3 bg-light d-flex align-items-center gap-3">
                            <img
                              src={profileForm.logoUrl}
                              alt="Logo preview"
                              style={{ width: 64, height: 64, objectFit: "cover" }}
                              className="rounded-3 shadow-sm border"
                              onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                            />
                            <div>
                              <small className="fw-semibold d-block text-dark">Vista previa del logo</small>
                              <small className="text-muted" style={{ fontSize: "0.75rem" }}>Asegúrate de que la imagen sea nítida</small>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <label className="form-label small fw-semibold">Descripción / Especialidad</label>
                        <textarea
                          className="form-control rounded-3"
                          rows={3}
                          placeholder="Cuéntale a tus comensales lo que hace especial a tu restaurante..."
                          value={profileForm.description || ""}
                          onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="btn w-100 fw-bold rounded-pill py-2 shadow-sm"
                        style={{ background: "#ffd54a", color: "#3a2a00" }}
                      >
                        {savingProfile ? "Guardando cambios..." : "Guardar Cambios de mi Restaurante"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL CREAR / EDITAR PROMOCIÓN (HU 4.1 & 4.2) */}
      {isPromoModalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", zIndex: 1080, backdropFilter: "blur(4px)" }}
          onClick={() => setIsPromoModalOpen(false)}
        >
          <div
            className="card border-0 shadow-lg rounded-4 overflow-hidden"
            style={{ maxWidth: 560, width: "94%", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-white sticky-top">
              <div>
                <h4 className="fw-bold mb-0">
                  {editingPromoId ? "Editar Promoción" : "Crear Nueva Promoción"}
                </h4>
                <small className="text-muted">
                  {editingPromoId ? "Modifica los términos de tu oferta" : "Publica una nueva oferta para tus comensales"}
                </small>
              </div>
              <button
                type="button"
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center p-0"
                style={{ width: 34, height: 34 }}
                onClick={() => setIsPromoModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="card-body p-4">
              {promoMessage && (
                <div className="alert alert-success rounded-4 py-2 small" role="alert">
                  {promoMessage}
                </div>
              )}
              {promoError && (
                <div className="alert alert-danger rounded-4 py-2 small" role="alert">
                  {promoError}
                </div>
              )}

              <form onSubmit={handleSavePromo}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Título del cupón / oferta</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Ej. 2x1 en Hamburguesas Artesanales"
                    required
                    value={promoForm.title}
                    onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Código del cupón (para canje)</label>
                  <input
                    type="text"
                    className="form-control rounded-3 font-monospace fw-bold"
                    placeholder="Ej. BURGER2X1"
                    required
                    style={{ letterSpacing: 1 }}
                    value={promoForm.code}
                    onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Tipo de descuento</label>
                    <select
                      className="form-select rounded-3"
                      value={promoForm.discountType}
                      onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value as any })}
                    >
                      <option value="PERCENTAGE">Porcentaje (%)</option>
                      <option value="FIXED_AMOUNT">Monto Fijo ($)</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">
                      Valor ({promoForm.discountType === "PERCENTAGE" ? "%" : "$ COP"})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control rounded-3"
                      required
                      value={promoForm.discountValue}
                      onChange={(e) => setPromoForm({ ...promoForm, discountValue: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Compra mínima ($ COP)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control rounded-3"
                      placeholder="0 = Sin mínimo"
                      value={promoForm.minPurchase || ""}
                      onChange={(e) => setPromoForm({ ...promoForm, minPurchase: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Límite de canjes</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control rounded-3"
                      placeholder="Ej. 100"
                      value={promoForm.maxRedemptions || ""}
                      onChange={(e) => setPromoForm({ ...promoForm, maxRedemptions: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Fecha de inicio</label>
                    <input
                      type="datetime-local"
                      className="form-control rounded-3"
                      required
                      value={promoForm.startDate}
                      onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Fecha de vencimiento</label>
                    <input
                      type="datetime-local"
                      className="form-control rounded-3"
                      required
                      value={promoForm.endDate}
                      onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">URL de imagen de la oferta</label>
                  <input
                    type="url"
                    className="form-control rounded-3"
                    placeholder="https://images.unsplash.com/..."
                    value={promoForm.imageUrl || ""}
                    onChange={(e) => setPromoForm({ ...promoForm, imageUrl: e.target.value })}
                  />
                  {promoForm.imageUrl && (
                    <div className="mt-2 p-2 border rounded-3 bg-light d-flex align-items-center gap-3">
                      <img
                        src={promoForm.imageUrl}
                        alt="Vista previa"
                        style={{ width: 80, height: 60, objectFit: "cover" }}
                        className="rounded-3 shadow-sm border"
                        onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                      />
                      <div>
                        <small className="fw-semibold d-block text-dark">Vista previa del cupón</small>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>Así se verá en las tarjetas de ofertas</small>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">Descripción o condiciones</label>
                  <textarea
                    className="form-control rounded-3"
                    rows={3}
                    placeholder="Describe los productos incluidos, horarios válidos..."
                    value={promoForm.description || ""}
                    onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={promoSaving}
                  className="btn w-100 text-white fw-bold rounded-pill py-2 shadow-sm"
                  style={{ background: "linear-gradient(90deg, #7b2ff7, #f107a3)" }}
                >
                  {promoSaving ? "Guardando..." : editingPromoId ? "Actualizar Oferta" : "Publicar Cupón"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
