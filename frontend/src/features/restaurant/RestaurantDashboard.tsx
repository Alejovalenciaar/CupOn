import { useState, useEffect } from "react";
import { Restaurant, Promotion, CreatePromotionRequest, UpdateRestaurantRequest, Category, PromotionStats, RedemptionHistoryItem } from "@/types";
import { getMyRestaurant, updateMyRestaurant } from "@/api/restaurantServices";
import {
  getMyPromotions,
  getMyPromotionStats,
  getCategories,
  createPromotion,
  updatePromotion,
  deletePromotion,
  updatePromotionStatus,
  getRestaurantRedemptions,
  verifyRedemption,
} from "@/api/promotionServices";
import { ImageUploader } from "@/components/ImageUpLoader";
import RestaurantMap from "@/components/RestaurantMap";
import { downloadCsv } from "@/utils/csv";

interface RestaurantDashboardProps {
  currentUser?: { email: string; role: string };
  onLogout?: () => void;
  onSwitchToCustomerView?: () => void;
  onCatalogNeedsRefresh?: () => void;
}

type Tab = "metrics" | "promotions" | "redemptions" | "profile";

// ── Campo de formulario reutilizable ──────────────────────────────────────────
const Field = ({
  label, children, hint,
}: { label: string; children: React.ReactNode; hint?: string }) => (
  <div>
    <label className="block text-xs font-semibold text-content-primary mb-1">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-content-muted mt-1">{hint}</p>}
  </div>
);

const WEEK_DAYS = [
  { key: "MONDAY", label: "Lun" },
  { key: "TUESDAY", label: "Mar" },
  { key: "WEDNESDAY", label: "Mié" },
  { key: "THURSDAY", label: "Jue" },
  { key: "FRIDAY", label: "Vie" },
  { key: "SATURDAY", label: "Sáb" },
  { key: "SUNDAY", label: "Dom" },
];

const inputCls = "w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500 shadow-subtle";

const toLocalDateTimeInput = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getPromoStatusMeta = (status: Promotion["status"]) => {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Activa",
        cardLabel: "● Activa",
        listCls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        cardCls: "bg-emerald-600 text-white",
      };
    case "DRAFT":
      return {
        label: "Borrador",
        cardLabel: "📝 Borrador",
        listCls: "bg-slate-100 text-slate-700 border border-slate-200",
        cardCls: "bg-slate-700 text-white",
      };
    case "EXPIRED":
      return {
        label: "Expirada",
        cardLabel: "⌛ Expirada",
        listCls: "bg-red-50 text-red-700 border border-red-200",
        cardCls: "bg-red-600 text-white",
      };
    default:
      return {
        label: "Pausada",
        cardLabel: "⏸ Pausada",
        listCls: "bg-surface-muted text-content-muted border border-surface-border",
        cardCls: "bg-surface-muted text-content-secondary border border-surface-border",
      };
  }
};

export default function RestaurantDashboard({
  currentUser,
  onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cupon_user");
    window.location.href = "/";
  },
  onSwitchToCustomerView = () => { window.location.href = "/"; },
  onCatalogNeedsRefresh,
}: RestaurantDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("metrics");
  const [restaurantData, setRestaurantData] = useState<Restaurant | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionHistoryItem[]>([]);
  const [verifyCodeInput, setVerifyCodeInput] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [stats, setStats] = useState<PromotionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Profile form
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateRestaurantRequest>({
    businessName: "", cuisineType: "", description: "", address: "", latitude: null, longitude: null, phoneNumber: "", logoUrl: "",
  });

  // Promo modal
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [copiedPromoId, setCopiedPromoId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promoForm, setPromoForm] = useState<CreatePromotionRequest>({
    title: "", description: "", code: "", discountType: "PERCENTAGE",
    discountValue: 20, minPurchase: 0,
    startDate: toLocalDateTimeInput(new Date()),
    endDate: toLocalDateTimeInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    maxRedemptions: 100,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop",
    daysOfWeek: [], categoryIds: [], startTime: "", endTime: "",
  });

  useEffect(() => {
    loadDashboardData();
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [restData, promoData] = await Promise.all([
        getMyRestaurant(),
        getMyPromotions(0, 50),
      ]);
      setRestaurantData(restData);
      setPromotions(promoData.content);
      loadStats();
      setProfileForm({
        businessName: restData.businessName || "",
        cuisineType: restData.cuisineType || "",
        description: restData.description || "",
        address: restData.address || "",
        latitude: restData.latitude ?? 4.6768,
        longitude: restData.longitude ?? -74.0482,
        phoneNumber: restData.phoneNumber || "",
        logoUrl: restData.logoUrl || "",
      });
    } catch {
      showToast("Error al cargar los datos del panel.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Si las estadísticas fallan, las tarjetas muestran "—" sin bloquear el resto del panel
  const loadStats = () => {
    getMyPromotionStats().then(setStats).catch(() => setStats(null));
    getRestaurantRedemptions(0, 30).then((d) => setRedemptions(d.content || [])).catch(() => {});
  };

  const handleVerifyRedemption = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = verifyCodeInput.trim().toUpperCase();
    if (!cleaned) return;
    setVerifyingCode(true);
    setVerifyFeedback(null);
    try {
      const verified = await verifyRedemption(cleaned);
      setVerifyFeedback({
        msg: `Canje validado: ${verified.promotionTitle} (${verified.verificationCode})`,
        type: "success",
      });
      setVerifyCodeInput("");
      getRestaurantRedemptions(0, 30).then((d) => setRedemptions(d.content || [])).catch(() => {});
    } catch (err: any) {
      setVerifyFeedback({
        msg: err.response?.data?.message || "No se pudo validar el código.",
        type: "error",
      });
    } finally {
      setVerifyingCode(false);
    }
  };

  const refreshPromotions = async () => {
    const refreshed = await getMyPromotions(0, 50);
    setPromotions(refreshed.content);
    loadStats();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateMyRestaurant(profileForm);
      setRestaurantData(updated);
      showToast("Información del restaurante actualizada.");
      onCatalogNeedsRefresh?.();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al actualizar.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const openCreatePromo = () => {
    setEditingPromoId(null);
    setPromoError(null);
    setPromoForm({
      title: "", description: "", code: "", discountType: "PERCENTAGE",
      discountValue: 20, minPurchase: 0,
      startDate: toLocalDateTimeInput(new Date()),
      endDate: toLocalDateTimeInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      maxRedemptions: 100,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop",
      daysOfWeek: [], categoryIds: [], startTime: "", endTime: "",
    });
    setIsPromoModalOpen(true);
  };

  const openEditPromo = (promo: Promotion) => {
    setEditingPromoId(promo.id);
    setPromoError(null);
    setPromoForm({
      title: promo.title,
      description: promo.description || "",
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minPurchase: promo.minPurchase || 0,
      startDate: promo.startDate ? promo.startDate.slice(0, 16) : toLocalDateTimeInput(new Date()),
      endDate: promo.endDate ? promo.endDate.slice(0, 16) : toLocalDateTimeInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      maxRedemptions: promo.maxRedemptions || 100,
      imageUrl: promo.imageUrl || "",
      daysOfWeek: promo.daysOfWeek || [],
      // PromotionResponse expone nombres; los nombres de categoría son únicos.
      // Si no cargaron las categorías se omite el campo para no borrar las existentes.
      categoryIds: categories.length
        ? categories.filter((c) => promo.categories?.includes(c.name)).map((c) => c.id)
        : undefined,
      startTime: promo.startTime ? promo.startTime.slice(0, 5) : "",
      endTime: promo.endTime ? promo.endTime.slice(0, 5) : "",
    });
    setIsPromoModalOpen(true);
  };

  const openDuplicatePromo = (promo: Promotion) => {
    setEditingPromoId(null);
    setPromoError(null);
    setPromoForm({
      title: `${promo.title} (Copia)`,
      description: promo.description || "",
      code: promo.code ? `${promo.code}2`.slice(0, 50) : "",
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minPurchase: promo.minPurchase || 0,
      startDate: toLocalDateTimeInput(new Date()),
      endDate: toLocalDateTimeInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      maxRedemptions: promo.maxRedemptions || 100,
      imageUrl: promo.imageUrl || "",
      daysOfWeek: promo.daysOfWeek || [],
      categoryIds: categories.length
        ? categories.filter((c) => promo.categories?.includes(c.name)).map((c) => c.id)
        : [],
      startTime: promo.startTime ? promo.startTime.slice(0, 5) : "",
      endTime: promo.endTime ? promo.endTime.slice(0, 5) : "",
    });
    setIsPromoModalOpen(true);
  };

  const handleExportRestaurantCsv = () => {
    const slug = (restaurantData?.businessName || "restaurante").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadCsv(
      `metricas-${slug}.csv`,
      ["Código", "Título", "Estado", "Tipo descuento", "Valor", "Vistas", "Canjes", "Límite", "Inicio", "Vencimiento"],
      promotions.map((p) => [
        p.code,
        p.title,
        p.status,
        p.discountType,
        p.discountValue,
        p.viewCount || 0,
        p.currentRedemptions || 0,
        p.maxRedemptions || "Ilimitado",
        p.startDate,
        p.endDate,
      ])
    );
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Boolean(promoForm.startTime) !== Boolean(promoForm.endTime)) {
      setPromoError("Indica hora de inicio y de fin, o deja ambas vacías para todo el día.");
      return;
    }
    if (promoForm.startTime && promoForm.endTime && promoForm.startTime >= promoForm.endTime) {
      setPromoError("La hora de inicio debe ser anterior a la hora de fin.");
      return;
    }
    setPromoSaving(true);
    setPromoError(null);
    const payload = {
      ...promoForm,
      startDate: promoForm.startDate.length === 16 ? `${promoForm.startDate}:00` : promoForm.startDate,
      endDate: promoForm.endDate.length === 16 ? `${promoForm.endDate}:00` : promoForm.endDate,
      startTime: promoForm.startTime || null,
      endTime: promoForm.endTime || null,
    };
    try {
      if (editingPromoId) {
        await updatePromotion(editingPromoId, payload);
        showToast("Promoción actualizada.");
      } else {
        await createPromotion(payload);
        showToast("Promoción publicada exitosamente.");
      }
      await refreshPromotions();
      onCatalogNeedsRefresh?.();
      setTimeout(() => { setIsPromoModalOpen(false); }, 1200);
    } catch (err: any) {
      setPromoError(err.response?.data?.message || "Error al guardar la promoción.");
    } finally {
      setPromoSaving(false);
    }
  };

  const handleToggleStatus = async (promo: Promotion) => {
    const nextStatus = promo.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      await updatePromotionStatus(promo.id, nextStatus);
      await refreshPromotions();
      onCatalogNeedsRefresh?.();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al cambiar estado.", "error");
    }
  };

  const handleDeletePromo = async (promoId: string) => {
    if (!window.confirm("¿Eliminar este cupón permanentemente?")) return;
    try {
      await deletePromotion(promoId);
      await refreshPromotions();
      onCatalogNeedsRefresh?.();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al eliminar.", "error");
    }
  };

  const handleSharePromo = (promo: Promotion) => {
    const url = `${window.location.origin}/?promo=${promo.id}`;
    if (navigator.share) {
      navigator.share({ title: promo.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedPromoId(promo.id);
      setTimeout(() => setCopiedPromoId(null), 2500);
    }
  };

  // Métricas calculadas
  const totalRedemptions = promotions.reduce((s, p) => s + (p.currentRedemptions || 0), 0);
  const totalCapacity = promotions.reduce((s, p) => s + (p.maxRedemptions || 0), 0);
  const redemptionRate = totalCapacity > 0 ? Math.round((totalRedemptions / totalCapacity) * 100) : 0;
  const totalViews = stats?.totalViews ?? 0;
  const viewConversion = totalViews > 0 ? Math.round((totalRedemptions / totalViews) * 100) : 0;
  const bestPromo = [...promotions].sort((a, b) => (b.currentRedemptions || 0) - (a.currentRedemptions || 0))[0];

  const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
    { id: "metrics", label: "Métricas y rendimiento", icon: "📊" },
    { id: "promotions", label: `Mis cupones (${promotions.length})`, icon: "🎟️" },
    { id: "redemptions", label: `Validar canje (${redemptions.length})`, icon: "✅" },
    { id: "profile", label: "Perfil del local", icon: "🏢" },
  ];

  const isApproved = restaurantData?.approvalStatus === "APPROVED";

  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary antialiased flex flex-col">

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <header className="bg-surface-card border-b border-surface-border sticky top-0 z-40 shadow-subtle">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="md:hidden p-1 rounded-button text-content-secondary hover:bg-surface-muted"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            {restaurantData?.logoUrl ? (
              <img src={restaurantData.logoUrl} alt="Logo" className="w-8 h-8 rounded-button object-cover border border-surface-border" />
            ) : (
              <div className="w-8 h-8 rounded-button bg-brand-100 border border-brand-200 flex items-center justify-center text-base">🏪</div>
            )}
            <div className="hidden sm:block">
              <span className="font-semibold text-sm text-content-primary">
                {restaurantData?.businessName || "Portal Restaurante"}
              </span>
              <span className={`ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-button border ${
                isApproved
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {isApproved ? "Verificado" : "Pendiente"}
              </span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {currentUser && (
              <span className="hidden sm:inline text-xs text-content-muted bg-surface-muted border border-surface-border px-2.5 py-1 rounded-button">
                {currentUser.email}
              </span>
            )}
            <button
              type="button"
              onClick={openCreatePromo}
              disabled={!isApproved}
              title={!isApproved ? "Tu restaurante debe estar aprobado para publicar cupones" : undefined}
              className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-button transition-colors shadow-subtle"
            >
              + Nuevo cupón
            </button>
            <button
              type="button"
              onClick={onSwitchToCustomerView}
              className="hidden sm:inline text-xs font-medium text-content-secondary border border-surface-border bg-white hover:bg-surface-muted px-3 py-1.5 rounded-button transition-colors"
            >
              Ver catálogo
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-medium text-content-secondary border border-surface-border bg-white hover:bg-surface-muted px-3 py-1.5 rounded-button transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-56 bg-surface-card border-r border-surface-border shadow-hover transform transition-transform md:static md:translate-x-0 md:shadow-none md:flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className="p-4 pt-16 md:pt-4 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-content-muted px-2 mb-3">
              Gestión
            </p>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-button text-sm font-medium transition-colors text-left ${
                  activeTab === item.id
                    ? "bg-brand-50 text-brand-700 border border-brand-200"
                    : "text-content-secondary hover:bg-surface-muted hover:text-content-primary"
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}

            {/* Estado del local */}
            <div className="pt-4 mt-4 border-t border-surface-border">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-content-muted px-2 mb-2">
                Estado del local
              </p>
              <div className={`mx-2 px-3 py-2 rounded-button border text-xs ${
                isApproved
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}>
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? "bg-emerald-500" : "bg-amber-400"}`} />
                  {isApproved ? "Aprobado y activo" : "Pendiente de revisión"}
                </div>
                <p className="mt-0.5 text-[11px] opacity-80 leading-relaxed">
                  {isApproved
                    ? "Tus cupones son visibles en el catálogo."
                    : "El equipo revisará tus datos en 24–48 h."}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── MAIN ─────────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Toast */}
          {toast && (
            <div className={`px-4 py-3 rounded-card text-sm border ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}>
              {toast.msg}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-content-muted">
              <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Cargando tu panel de gestión...</span>
            </div>
          ) : (
            <>
              {/* ── MÉTRICAS ────────────────────────────────────────────── */}
              {activeTab === "metrics" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl font-bold text-content-primary">Rendimiento de tus cupones</h1>
                      <p className="text-xs text-content-secondary mt-0.5">Estadísticas en tiempo real de atracción y canjes</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportRestaurantCsv}
                        disabled={promotions.length === 0}
                        className="bg-white hover:bg-surface-muted disabled:opacity-50 text-content-secondary border border-surface-border text-xs font-medium px-3 py-2 rounded-button transition-colors shadow-subtle"
                      >
                        ⬇ Exportar CSV
                      </button>
                      <button
                        type="button"
                        onClick={openCreatePromo}
                        disabled={!isApproved}
                        className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-button transition-colors shadow-subtle"
                      >
                        + Publicar cupón
                      </button>
                    </div>
                  </div>

                  {/* KPIs de estado (GET /promotions/mine/stats) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Activas", value: stats?.active ?? "—", sub: "visibles en el catálogo", icon: "🟢", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                      { label: "Pausadas", value: stats?.paused ?? "—", sub: "ocultas temporalmente", icon: "⏸", color: "text-amber-600 bg-amber-50 border-amber-100" },
                      { label: "Expiradas", value: stats?.expired ?? "—", sub: "fecha de fin vencida", icon: "⌛", color: "text-slate-600 bg-slate-50 border-slate-200" },
                      { label: "Vistas totales", value: stats?.totalViews ?? "—", sub: `${viewConversion}% terminan en canje`, icon: "👁️", color: "text-sky-600 bg-sky-50 border-sky-100" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-surface-card border border-surface-border rounded-card p-4 shadow-subtle">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-content-muted">{kpi.label}</span>
                          <span className={`text-base p-1.5 rounded-button border ${kpi.color}`}>{kpi.icon}</span>
                        </div>
                        <div className="text-2xl font-bold text-content-primary">{kpi.value}</div>
                        <p className="text-[11px] text-content-muted mt-0.5">{kpi.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* KPIs de rendimiento */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Canjes totales", value: totalRedemptions, sub: "clientes que redimieron", icon: "👥", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                      { label: "Tasa de redención", value: `${redemptionRate}%`, sub: "sobre el límite total", icon: "📈", color: "text-amber-600 bg-amber-50 border-amber-100" },
                      {
                        label: "Top cupón",
                        value: bestPromo ? bestPromo.code : "—",
                        sub: bestPromo ? `${bestPromo.currentRedemptions} canjes` : "Crea tu primera oferta",
                        icon: "🏆",
                        color: "text-brand-600 bg-brand-50 border-brand-100",
                        mono: true,
                      },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-surface-card border border-surface-border rounded-card p-4 shadow-subtle">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-content-muted">{kpi.label}</span>
                          <span className={`text-base p-1.5 rounded-button border ${kpi.color}`}>{kpi.icon}</span>
                        </div>
                        <div className={`text-2xl font-bold text-content-primary truncate ${(kpi as any).mono ? "font-mono text-lg" : ""}`}>
                          {kpi.value}
                        </div>
                        <p className="text-[11px] text-content-muted mt-0.5">{kpi.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Barras de progreso por cupón */}
                  <div className="bg-surface-card border border-surface-border rounded-card p-5 shadow-subtle">
                    <h2 className="text-sm font-semibold text-content-primary mb-4">Progreso de canjes por cupón</h2>
                    {promotions.length === 0 ? (
                      <p className="text-xs text-content-muted text-center py-6">No hay cupones registrados aún.</p>
                    ) : (
                      <div className="space-y-3">
                        {promotions.map((promo) => {
                          const max = promo.maxRedemptions || 100;
                          const cur = promo.currentRedemptions || 0;
                          const pct = Math.min(100, Math.round((cur / max) * 100));
                          return (
                            <div key={promo.id} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono text-[11px] bg-surface-muted border border-surface-border text-content-secondary px-1.5 py-0.5 rounded-button flex-shrink-0">
                                    {promo.code}
                                  </span>
                                  <span className="text-xs font-medium text-content-primary truncate">{promo.title}</span>
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-button flex-shrink-0 ${getPromoStatusMeta(promo.status).listCls}`}>
                                    {getPromoStatusMeta(promo.status).label}
                                  </span>
                                </div>
                                <span className="text-[11px] text-content-secondary flex-shrink-0 ml-2">👁️ {promo.viewCount || 0} · {cur}/{max} ({pct}%)</span>
                              </div>
                              <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${pct > 80 ? "bg-brand-600" : "bg-brand-400"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Tip */}
                  <div className="bg-brand-50 border border-brand-100 rounded-card p-5 flex items-start gap-4">
                    <span className="text-2xl flex-shrink-0">💡</span>
                    <div>
                      <p className="text-sm font-semibold text-content-primary">Recomendación para aumentar tus canjes</p>
                      <p className="text-xs text-content-secondary mt-1 leading-relaxed">
                        Las promociones con descuentos redondos (20%, 30% o 50%) y compras mínimas moderadas
                        atraen hasta un 65% más de visitas durante las horas de la tarde entre semana.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── GESTIÓN DE CUPONES ──────────────────────────────────── */}
              {activeTab === "promotions" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl font-bold text-content-primary">Mis cupones</h1>
                      <p className="text-xs text-content-secondary mt-0.5">Crea, edita, pausa o elimina tus ofertas</p>
                    </div>
                    <button
                      type="button"
                      onClick={openCreatePromo}
                      className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-button transition-colors shadow-subtle"
                    >
                      + Crear cupón
                    </button>
                  </div>

                  {promotions.length === 0 ? (
                    <div className="bg-surface-card border border-surface-border rounded-card p-12 text-center">
                      <span className="text-3xl block mb-2">🎟️</span>
                      <h3 className="font-semibold text-content-primary">Aún no tienes cupones</h3>
                      <p className="text-xs text-content-secondary mt-1 mb-4">Crea tu primera oferta para que los clientes te descubran.</p>
                      <button
                        type="button"
                        onClick={openCreatePromo}
                        className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-4 py-2 rounded-button transition-colors"
                      >
                        Crear mi primera oferta →
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {promotions.map((promo) => (
                        <div key={promo.id} className="bg-surface-card border border-surface-border rounded-card shadow-subtle overflow-hidden flex flex-col">
                          {/* Imagen */}
                          <div className="relative">
                            <img
                              src={promo.imageUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=200&fit=crop"}
                              alt={promo.title}
                              className="w-full h-36 object-cover"
                            />
                            <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-button ${getPromoStatusMeta(promo.status).cardCls}`}>
                              {getPromoStatusMeta(promo.status).cardLabel}
                            </span>
                            <span className="absolute top-2 right-2 text-[10px] font-bold bg-brand-600 text-white px-2 py-0.5 rounded-button">
                              {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}% OFF` : `$${Number(promo.discountValue).toLocaleString()}`}
                            </span>
                          </div>

                          {/* Cuerpo */}
                          <div className="p-4 flex-1 space-y-2">
                            <span className="inline-block font-mono text-[10px] bg-surface-muted border border-surface-border text-content-secondary px-2 py-0.5 rounded-button">
                              {promo.code}
                            </span>
                            <p className="font-semibold text-sm text-content-primary leading-tight">{promo.title}</p>
                            <p className="text-xs text-content-secondary line-clamp-2">{promo.description || "Sin descripción."}</p>

                            <div className="flex justify-between text-[11px] text-content-muted pt-1">
                              <span>Canjes: <strong className="text-content-primary">{promo.currentRedemptions || 0}/{promo.maxRedemptions || "∞"}</strong></span>
                              <span>Vistas: <strong className="text-content-primary">{promo.viewCount || 0}</strong></span>
                              <span>Mín: <strong className="text-content-primary">{promo.minPurchase ? `$${Number(promo.minPurchase).toLocaleString()}` : "Ninguno"}</strong></span>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="px-4 py-3 border-t border-surface-border flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(promo)}
                              className={`flex-1 text-xs font-medium py-1.5 rounded-button border transition-colors ${
                                promo.status === "ACTIVE"
                                  ? "bg-white text-content-secondary border-surface-border hover:bg-surface-muted"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              }`}
                            >
                              {promo.status === "ACTIVE" ? "⏸ Pausar" : "▶ Activar"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditPromo(promo)}
                              className="p-1.5 text-sm rounded-button border border-surface-border bg-white hover:bg-surface-muted transition-colors"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => openDuplicatePromo(promo)}
                              disabled={!isApproved}
                              className="p-1.5 text-sm rounded-button border border-surface-border bg-white hover:bg-surface-muted disabled:opacity-50 transition-colors"
                              title="Duplicar cupón"
                            >
                              📋
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSharePromo(promo)}
                              className="p-1.5 text-sm rounded-button border border-surface-border bg-white hover:bg-surface-muted transition-colors"
                              title="Compartir enlace"
                            >
                              {copiedPromoId === promo.id ? "✓" : "↗️"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePromo(promo.id)}
                              className="p-1.5 text-sm rounded-button border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── VALIDAR CANJE EN CAJA ────────────────────────────────── */}
              {activeTab === "redemptions" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-xl font-bold text-content-primary">Validar canje en caja</h1>
                    <p className="text-xs text-content-secondary mt-0.5">
                      Ingresa el código único que presenta el cliente (ej. CUP-A7X9K2) para confirmar el uso del cupón
                    </p>
                  </div>

                  <div className="bg-surface-card border border-surface-border rounded-card p-5 shadow-subtle max-w-xl">
                    <form onSubmit={handleVerifyRedemption} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        required
                        placeholder="CUP-XXXXXX"
                        value={verifyCodeInput}
                        onChange={(e) => setVerifyCodeInput(e.target.value.toUpperCase())}
                        className={`${inputCls} font-mono tracking-widest uppercase flex-1`}
                      />
                      <button
                        type="submit"
                        disabled={verifyingCode}
                        className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-button transition-colors shadow-subtle whitespace-nowrap"
                      >
                        {verifyingCode ? "Validando..." : "Validar código"}
                      </button>
                    </form>
                    {verifyFeedback && (
                      <div
                        className={`mt-3 px-3 py-2.5 rounded-button text-xs border ${
                          verifyFeedback.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        {verifyFeedback.msg}
                      </div>
                    )}
                  </div>

                  <div className="bg-surface-card border border-surface-border rounded-card p-5 shadow-subtle">
                    <h2 className="text-sm font-semibold text-content-primary mb-4">Historial de canjes recientes</h2>
                    {redemptions.length === 0 ? (
                      <p className="text-xs text-content-muted text-center py-6">
                        Aún no hay canjes registrados para tus promociones.
                      </p>
                    ) : (
                      <div className="divide-y divide-surface-border">
                        {redemptions.map((item) => (
                          <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold bg-surface-muted border border-surface-border px-2 py-0.5 rounded-button text-content-primary">
                                  {item.verificationCode}
                                </span>
                                <span className="text-xs font-semibold text-content-primary truncate">
                                  {item.promotionTitle}
                                </span>
                              </div>
                              <p className="text-[11px] text-content-muted">
                                {item.customerEmail || "Cliente anónimo"} ·{" "}
                                {new Date(item.redeemedAt).toLocaleString("es-ES", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-button border self-start sm:self-center shrink-0 ${
                                item.verified
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {item.verified ? "✓ Validado en caja" : "⏳ Pendiente"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── PERFIL DEL LOCAL ─────────────────────────────────────── */}
              {activeTab === "profile" && (
                <div className="max-w-xl space-y-5">
                  <div>
                    <h1 className="text-xl font-bold text-content-primary">Perfil del establecimiento</h1>
                    <p className="text-xs text-content-secondary mt-0.5">Esta información es visible para los clientes en el catálogo público</p>
                  </div>

                  <div className="bg-surface-card border border-surface-border rounded-card p-6 shadow-subtle space-y-5">
                    {/* Badge estado */}
                    <div className={`flex items-start gap-3 p-3 rounded-button border text-xs ${
                      isApproved
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-amber-50 border-amber-200 text-amber-800"
                    }`}>
                      <span className="text-lg">{isApproved ? "🟢" : "🟡"}</span>
                      <div>
                        <p className="font-semibold">{isApproved ? "Aprobado y visible en el catálogo" : "Pendiente de validación"}</p>
                        <p className="opacity-75 mt-0.5">
                          {isApproved
                            ? "Tu restaurante es visible para todos los usuarios de CupOn."
                            : "El equipo de CupOn revisará tu perfil en las próximas 24–48 horas."}
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Nombre comercial *">
                          <input
                            type="text"
                            required
                            className={inputCls}
                            value={profileForm.businessName || ""}
                            onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                          />
                        </Field>
                        <Field label="Categoría / Tipo de cocina" hint="Ej: Hamburguesas, Sushi, Mexicana, Café, etc.">
                          <input
                            type="text"
                            placeholder="Ej. Hamburguesas, Sushi, Parrilla"
                            className={inputCls}
                            value={profileForm.cuisineType || ""}
                            onChange={(e) => setProfileForm({ ...profileForm, cuisineType: e.target.value })}
                          />
                        </Field>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Dirección del local *">
                          <input
                            type="text"
                            required
                            placeholder="Carrera 7 # 72-10"
                            className={inputCls}
                            value={profileForm.address || ""}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          />
                        </Field>
                        <Field label="Teléfono de atención">
                          <input
                            type="tel"
                            placeholder="+57 300 000 0000"
                            className={inputCls}
                            value={profileForm.phoneNumber || ""}
                            onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                          />
                        </Field>
                      </div>

                      {/* Geolocalización en Mapa (HU25) */}
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-content-primary">
                            Ubicación en el mapa (Geolocalización)
                          </label>
                          {profileForm.latitude != null && profileForm.longitude != null && (
                            <span className="font-mono text-[11px] text-content-muted">
                              {profileForm.latitude.toFixed(5)}, {profileForm.longitude.toFixed(5)}
                            </span>
                          )}
                        </div>

                        <RestaurantMap
                          latitude={profileForm.latitude}
                          longitude={profileForm.longitude}
                          businessName={profileForm.businessName}
                          address={profileForm.address}
                          interactive={true}
                          heightClassName="h-56"
                          onLocationChange={(lat, lng) =>
                            setProfileForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                          }
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Latitud">
                            <input
                              type="number"
                              step="any"
                              min="-90"
                              max="90"
                              placeholder="4.6768"
                              className={`${inputCls} font-mono text-xs`}
                              value={profileForm.latitude ?? ""}
                              onChange={(e) =>
                                setProfileForm({
                                  ...profileForm,
                                  latitude: e.target.value === "" ? null : parseFloat(e.target.value),
                                })
                              }
                            />
                          </Field>
                          <Field label="Longitud">
                            <input
                              type="number"
                              step="any"
                              min="-180"
                              max="180"
                              placeholder="-74.0482"
                              className={`${inputCls} font-mono text-xs`}
                              value={profileForm.longitude ?? ""}
                              onChange={(e) =>
                                setProfileForm({
                                  ...profileForm,
                                  longitude: e.target.value === "" ? null : parseFloat(e.target.value),
                                })
                              }
                            />
                          </Field>
                        </div>
                      </div>

                      <ImageUploader
                        label="Logo o imagen del restaurante"
                        folder="logos"
                        aspectRatio="square"
                        value={profileForm.logoUrl}
                        onChange={(url) => setProfileForm({ ...profileForm, logoUrl: url })}
                        hint="Sube el logo de tu restaurante (JPG, PNG o WEBP, máx. 5MB)"
                      />

                      <Field label="Descripción / Especialidad">
                        <textarea
                          rows={3}
                          placeholder="Cuéntale a los comensales lo que hace especial a tu restaurante..."
                          className={`${inputCls} resize-none`}
                          value={profileForm.description || ""}
                          onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                        />
                      </Field>

                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-button transition-colors shadow-subtle"
                      >
                        {savingProfile ? "Guardando cambios..." : "Guardar cambios del perfil"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── MODAL CREAR / EDITAR CUPÓN ───────────────────────────────────── */}
      {isPromoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsPromoModalOpen(false)}
        >
          <div
            className="bg-surface-card border border-surface-border rounded-card shadow-hover w-full max-w-lg max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="sticky top-0 bg-surface-card border-b border-surface-border px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-semibold text-content-primary text-base">
                  {editingPromoId ? "Editar cupón" : "Crear nuevo cupón"}
                </h2>
                <p className="text-xs text-content-secondary mt-0.5">
                  {editingPromoId ? "Modifica los términos de tu oferta" : "Publica una nueva oferta para tus comensales"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-button border border-surface-border bg-white hover:bg-surface-muted text-content-secondary text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {promoError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-button">
                  {promoError}
                </div>
              )}

              {/* Vista previa en vivo del cupón */}
              <div className="bg-surface-canvas border border-surface-border rounded-card p-3 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-content-muted block">
                  Vista previa en el catálogo
                </span>
                <div className="bg-surface-card border border-surface-border rounded-card overflow-hidden flex items-center gap-3 p-2.5 shadow-subtle">
                  <img
                    src={promoForm.imageUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop"}
                    alt="Vista previa"
                    className="w-20 h-16 rounded-button object-cover shrink-0 bg-surface-muted"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-brand-700 uppercase truncate">
                        {restaurantData?.businessName || "Tu restaurante"}
                      </span>
                      <span className="shrink-0 bg-brand-50 text-brand-700 border border-brand-200 text-[10px] font-bold px-1.5 py-0.5 rounded-button">
                        {promoForm.discountType === "PERCENTAGE"
                          ? `${promoForm.discountValue || 0}% OFF`
                          : `$${Number(promoForm.discountValue || 0).toLocaleString()}`}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-content-primary truncate">
                      {promoForm.title || "Título de tu oferta"}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-content-muted">
                      <span>
                        {promoForm.minPurchase ? `Mín. $${Number(promoForm.minPurchase).toLocaleString()}` : "Sin mínimo"}
                        {promoForm.startTime && promoForm.endTime ? ` · ${promoForm.startTime}–${promoForm.endTime}` : ""}
                      </span>
                      <span className="font-mono font-semibold text-content-primary bg-surface-muted border border-surface-border px-1.5 py-0.5 rounded">
                        {promoForm.code || "CODIGO"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSavePromo} className="space-y-4">
                <Field label="Título del cupón / oferta *">
                  <input
                    type="text"
                    required
                    placeholder="Ej. 2x1 en Hamburguesas Artesanales"
                    className={inputCls}
                    value={promoForm.title}
                    onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  />
                </Field>

                <Field label="Código del cupón *" hint="El cliente lo presenta al pagar. Solo mayúsculas y números.">
                  <input
                    type="text"
                    required
                    placeholder="Ej. BURGER2X1"
                    className={`${inputCls} font-mono tracking-widest uppercase`}
                    value={promoForm.code}
                    onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tipo de descuento">
                    <select
                      className={inputCls}
                      value={promoForm.discountType}
                      onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value as any })}
                    >
                      <option value="PERCENTAGE">Porcentaje (%)</option>
                      <option value="FIXED_AMOUNT">Monto fijo ($)</option>
                    </select>
                  </Field>
                  <Field label={`Valor (${promoForm.discountType === "PERCENTAGE" ? "%" : "$ COP"})`}>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      className={inputCls}
                      value={promoForm.discountValue}
                      onChange={(e) => setPromoForm({ ...promoForm, discountValue: parseFloat(e.target.value) || 0 })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Compra mínima ($ COP)">
                    <input
                      type="number"
                      min="0"
                      placeholder="0 = sin mínimo"
                      className={inputCls}
                      value={promoForm.minPurchase || ""}
                      onChange={(e) => setPromoForm({ ...promoForm, minPurchase: parseFloat(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Límite de canjes">
                    <input
                      type="number"
                      min="1"
                      placeholder="100"
                      className={inputCls}
                      value={promoForm.maxRedemptions || ""}
                      onChange={(e) => setPromoForm({ ...promoForm, maxRedemptions: parseInt(e.target.value) || 100 })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Fecha de inicio *">
                    <input
                      type="datetime-local"
                      required
                      className={inputCls}
                      value={promoForm.startDate}
                      onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })}
                    />
                  </Field>
                  <Field label="Fecha de vencimiento *">
                    <input
                      type="datetime-local"
                      required
                      className={inputCls}
                      value={promoForm.endDate}
                      onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })}
                    />
                  </Field>
                </div>

                <Field label="Categorías" hint="Ayuda a los clientes a encontrar tu cupón en el catálogo.">
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(({ id, name }) => {
                      const selected = (promoForm.categoryIds || []).includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            const current = promoForm.categoryIds || [];
                            setPromoForm({
                              ...promoForm,
                              categoryIds: selected ? current.filter((c) => c !== id) : [...current, id],
                            });
                          }}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-button border transition-colors ${
                            selected
                              ? "bg-brand-600 border-brand-600 text-white"
                              : "bg-white border-surface-border text-content-secondary hover:bg-surface-muted"
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Días en que aplica" hint="Sin selección = todos los días.">
                  <div className="flex flex-wrap gap-1.5">
                    {WEEK_DAYS.map(({ key, label }) => {
                      const selected = (promoForm.daysOfWeek || []).includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            const current = promoForm.daysOfWeek || [];
                            setPromoForm({
                              ...promoForm,
                              daysOfWeek: selected ? current.filter((d) => d !== key) : [...current, key],
                            });
                          }}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-button border transition-colors ${
                            selected
                              ? "bg-brand-600 border-brand-600 text-white"
                              : "bg-white border-surface-border text-content-secondary hover:bg-surface-muted"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Hora de inicio" hint="Vacío = todo el día.">
                    <input
                      type="time"
                      className={inputCls}
                      value={promoForm.startTime || ""}
                      onChange={(e) => setPromoForm({ ...promoForm, startTime: e.target.value })}
                    />
                  </Field>
                  <Field label="Hora de fin">
                    <input
                      type="time"
                      className={inputCls}
                      value={promoForm.endTime || ""}
                      onChange={(e) => setPromoForm({ ...promoForm, endTime: e.target.value })}
                    />
                  </Field>
                </div>

                <ImageUploader
                  label="Imagen de la oferta"
                  folder="promotions"
                  aspectRatio="video"
                  value={promoForm.imageUrl}
                  onChange={(url) => setPromoForm({ ...promoForm, imageUrl: url })}
                  hint="Sube una foto atractiva del plato o promoción (máx. 5MB)"
                />

                <Field label="Descripción / condiciones">
                  <textarea
                    rows={3}
                    placeholder="Describe los productos incluidos, horarios válidos, condiciones..."
                    className={`${inputCls} resize-none`}
                    value={promoForm.description || ""}
                    onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={promoSaving}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-button transition-colors shadow-subtle"
                >
                  {promoSaving ? "Guardando..." : editingPromoId ? "Actualizar cupón" : "Publicar cupón"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
