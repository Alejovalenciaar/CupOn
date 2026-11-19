import { useState, useEffect } from "react";
import { Restaurant, Promotion, SystemMetrics } from "@/types";
import {
  getSystemMetrics,
  getPendingRestaurants,
  approveRestaurant,
  suspendUser,
  getAdminPromotions,
  deletePromotionByAdmin,
} from "@/api/adminServices";
import { getRestaurants } from "@/api/restaurantServices";

interface AdminDashboardProps {
  currentUser?: { email: string; role: string };
  onLogout?: () => void;
  onSwitchToCustomerView?: () => void;
  onCatalogNeedsRefresh?: () => void;
}

type Tab = "metrics" | "pending" | "restaurants" | "moderation";

export default function AdminDashboard({
  currentUser,
  onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cupon_user");
    window.location.href = "/";
  },
  onSwitchToCustomerView = () => { window.location.href = "/"; },
  onCatalogNeedsRefresh,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("metrics");
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [pendingRestaurants, setPendingRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [allPromotions, setAllPromotions] = useState<Promotion[]>([]);
  const [promoStatusFilter, setPromoStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { loadAdminData(); }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [metricsData, pendingData, restaurantsData, promotionsData] = await Promise.all([
        getSystemMetrics(),
        getPendingRestaurants(0, 50),
        getRestaurants(0, 50),
        getAdminPromotions(0, 50),
      ]);
      setMetrics(metricsData);
      setPendingRestaurants(pendingData.content || []);
      setAllRestaurants(restaurantsData.content || []);
      setAllPromotions(promotionsData.content || []);
    } catch {
      showToast("Error al cargar los datos del panel.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (restaurantId: string, approved: boolean) => {
    const reason = approved ? undefined : prompt("Motivo del rechazo (opcional):") || undefined;
    try {
      await approveRestaurant(restaurantId, { approved, rejectionReason: reason });
      showToast(approved ? "Restaurante aprobado exitosamente." : "Restaurante rechazado.");
      await loadAdminData();
      onCatalogNeedsRefresh?.();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al procesar la solicitud.", "error");
    }
  };

  const handleSuspendRestaurant = async (rest: Restaurant) => {
    const targetId = rest.userId || rest.id;
    const isCurrentlyEnabled = rest.ownerEnabled !== false;
    const actionLabel = isCurrentlyEnabled ? "suspender" : "reactivar";
    if (!window.confirm(`¿Confirmas ${actionLabel} la cuenta de "${rest.businessName}"?`)) return;

    try {
      await suspendUser(targetId);
      showToast(
        isCurrentlyEnabled
          ? `Cuenta de "${rest.businessName}" suspendida.`
          : `Cuenta de "${rest.businessName}" reactivada.`
      );
      await loadAdminData();
      onCatalogNeedsRefresh?.();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al actualizar estado de la cuenta.", "error");
    }
  };

  const handleDeletePromotion = async (promotionId: string, title: string) => {
    if (!window.confirm(`¿Confirmas eliminar "${title}" por moderación?`)) return;
    try {
      await deletePromotionByAdmin(promotionId);
      showToast("Promoción eliminada por moderación.");
      await loadAdminData();
      onCatalogNeedsRefresh?.();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al eliminar.", "error");
    }
  };

  const NAV_ITEMS: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: "metrics", label: "Métricas del sistema", icon: "📊" },
    { id: "pending", label: "Solicitudes pendientes", icon: "⏳", badge: pendingRestaurants.length },
    { id: "restaurants", label: "Directorio de locales", icon: "🏪" },
    { id: "moderation", label: "Moderación de cupones", icon: "🎟️" },
  ];

  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary antialiased flex flex-col">

      {/* ── TOP BAR ───────────────────────────────────────────────────────── */}
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
            <div className="w-8 h-8 rounded-button bg-red-600 flex items-center justify-center text-white text-sm font-bold select-none">
              🛡️
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold text-sm text-content-primary">CupOn</span>
              <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-button">
                Superadmin
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
              onClick={onSwitchToCustomerView}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 border border-brand-200 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-button transition-colors"
            >
              Ver marketplace
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-medium text-content-secondary border border-surface-border bg-white hover:bg-surface-muted px-3 py-1.5 rounded-button transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* ── SIDEBAR NAV ─────────────────────────────────────────────────── */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-56 bg-surface-card border-r border-surface-border shadow-hover transform transition-transform md:static md:translate-x-0 md:shadow-none md:flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className="p-4 pt-16 md:pt-4 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-content-muted px-2 mb-3">
              Panel de control
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
                <span className="flex-1">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-surface-border">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-content-muted px-2 mb-2">
                Estado de servicios
              </p>
              {[
                { label: "API Spring Boot", ok: true },
                { label: "PostgreSQL", ok: true },
                { label: "Redis Cache", ok: true },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 px-2 py-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className="text-xs text-content-secondary">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
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
              <span className="text-sm">Cargando datos de la plataforma...</span>
            </div>
          ) : (
            <>
              {/* ── MÉTRICAS ──────────────────────────────────────────────── */}
              {activeTab === "metrics" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-xl font-bold text-content-primary">Métricas del sistema</h1>
                    <p className="text-xs text-content-secondary mt-0.5">Monitoreo en tiempo real de la plataforma CupOn</p>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                      { label: "Usuarios", value: metrics?.totalUsers ?? 0, icon: "👥", color: "text-blue-600 bg-blue-50 border-blue-100" },
                      { label: "Restaurantes", value: metrics?.totalRestaurants ?? 0, icon: "🏪", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                      { label: "Por aprobar", value: metrics?.pendingApprovals ?? 0, icon: "⏳", color: "text-amber-600 bg-amber-50 border-amber-100" },
                      { label: "Promociones", value: metrics?.totalPromotions ?? 0, icon: "🎟️", color: "text-violet-600 bg-violet-50 border-violet-100" },
                      { label: "Activas hoy", value: metrics?.activePromotions ?? 0, icon: "🔥", color: "text-brand-600 bg-brand-50 border-brand-100" },
                      { label: "Canjes totales", value: metrics?.totalRedemptions ?? 0, icon: "🏅", color: "text-rose-600 bg-rose-50 border-rose-100" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-surface-card border border-surface-border rounded-card p-4 shadow-subtle">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-content-muted">{kpi.label}</span>
                          <span className={`text-base p-1.5 rounded-button border ${kpi.color}`}>{kpi.icon}</span>
                        </div>
                        <div className="text-2xl font-bold text-content-primary">{kpi.value.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>

                  {/* Gráficas de analítica: Top 5 Restaurantes y Distribución de Promociones */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Top 5 Restaurantes (Gráfica de Barras) */}
                    <div className="lg:col-span-7 bg-surface-card border border-surface-border rounded-card p-5 shadow-subtle flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-sm font-semibold text-content-primary">Top 5 Restaurantes con Mayor Tracción</h2>
                          <p className="text-[11px] text-content-muted mt-0.5">Ranking por volumen de canjes y cupones activos</p>
                        </div>
                        <span className="text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-0.5 rounded-button">
                          🏆 Ranking
                        </span>
                      </div>

                      {(!metrics?.topRestaurants || metrics.topRestaurants.length === 0) ? (
                        <div className="flex-1 flex items-center justify-center py-8 text-xs text-content-muted">
                          Aún no hay actividad suficiente para el ranking.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(() => {
                            const maxRedemptions = Math.max(
                              1,
                              ...metrics.topRestaurants.map((r) => r.totalRedemptions),
                              ...metrics.topRestaurants.map((r) => r.activePromotions)
                            );
                            const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

                            return metrics.topRestaurants.map((rest, idx) => {
                              const valueForBar = rest.totalRedemptions > 0 ? rest.totalRedemptions : rest.activePromotions;
                              const barPct = Math.max(8, Math.round((valueForBar / maxRedemptions) * 100));

                              return (
                                <div key={rest.restaurantId} className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span>{medals[idx] || "•"}</span>
                                      <span className="font-semibold text-content-primary truncate">
                                        {rest.businessName}
                                      </span>
                                      {rest.cuisineType && (
                                        <span className="text-[10px] bg-surface-muted border border-surface-border text-content-secondary px-1.5 py-0.5 rounded-button shrink-0">
                                          {rest.cuisineType}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 text-[11px] text-content-secondary">
                                      <span>
                                        <strong className="text-content-primary">{rest.activePromotions}</strong> activas
                                      </span>
                                      <span className="font-mono font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-button">
                                        {rest.totalRedemptions} canjes
                                      </span>
                                    </div>
                                  </div>
                                  <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-brand-600 rounded-full transition-all duration-500"
                                      style={{ width: `${barPct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Distribución de estados de cupones y restaurantes */}
                    <div className="lg:col-span-5 bg-surface-card border border-surface-border rounded-card p-5 shadow-subtle flex flex-col justify-between space-y-5">
                      <div>
                        <h2 className="text-sm font-semibold text-content-primary">Distribución del Catálogo</h2>
                        <p className="text-[11px] text-content-muted mt-0.5">Proporción de ofertas por estado operativo</p>
                      </div>

                      {(() => {
                        const total = Math.max(1, allPromotions.length);
                        const active = allPromotions.filter((p) => p.status === "ACTIVE").length;
                        const disabled = allPromotions.filter((p) => p.status === "DISABLED").length;
                        const expired = allPromotions.filter((p) => p.status === "EXPIRED").length;
                        const draft = allPromotions.filter((p) => p.status === "DRAFT").length;

                        const segments = [
                          { label: "Activas", count: active, pct: Math.round((active / total) * 100), color: "bg-emerald-500", dot: "bg-emerald-500" },
                          { label: "Pausadas", count: disabled, pct: Math.round((disabled / total) * 100), color: "bg-amber-400", dot: "bg-amber-400" },
                          { label: "Vencidas", count: expired, pct: Math.round((expired / total) * 100), color: "bg-red-500", dot: "bg-red-500" },
                          { label: "Borrador", count: draft, pct: Math.round((draft / total) * 100), color: "bg-slate-400", dot: "bg-slate-400" },
                        ];

                        return (
                          <div className="space-y-4">
                            {/* Barra apilada */}
                            <div className="h-3 w-full bg-surface-muted rounded-full overflow-hidden flex">
                              {segments.map((seg) =>
                                seg.count > 0 ? (
                                  <div
                                    key={seg.label}
                                    className={`${seg.color} h-full transition-all duration-500`}
                                    style={{ width: `${(seg.count / total) * 100}%` }}
                                    title={`${seg.label}: ${seg.count} (${seg.pct}%)`}
                                  />
                                ) : null
                              )}
                            </div>

                            {/* Leyenda detallada */}
                            <div className="grid grid-cols-2 gap-2.5">
                              {segments.map((seg) => (
                                <div key={seg.label} className="bg-surface-muted border border-surface-border rounded-button p-2.5 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${seg.dot}`} />
                                    <span className="text-xs text-content-secondary">{seg.label}</span>
                                  </div>
                                  <span className="text-xs font-bold text-content-primary">
                                    {seg.count} <span className="text-[10px] font-normal text-content-muted">({seg.pct}%)</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Tasa de aprobación de restaurantes */}
                      <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs">
                        <span className="text-content-secondary">Restaurantes verificados</span>
                        <span className="font-semibold text-emerald-700">
                          {Math.max(0, (metrics?.totalRestaurants ?? 0) - (metrics?.pendingApprovals ?? 0))} de {metrics?.totalRestaurants ?? 0} locales
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen textual */}
                  <div className="bg-surface-card border border-surface-border rounded-card p-5 shadow-subtle">
                    <h2 className="text-sm font-semibold text-content-primary mb-4">Estado del ecosistema</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { title: "API Backend", desc: "Spring Boot 3.4 operando correctamente.", ok: true },
                        { title: "Base de Datos", desc: "PostgreSQL 16 con persistencia transaccional.", ok: true },
                        { title: "Caché Redis", desc: "Aceleración de catálogos activa.", ok: true },
                      ].map((s) => (
                        <div key={s.title} className="bg-surface-muted border border-surface-border rounded-button p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${s.ok ? "bg-emerald-500" : "bg-red-500"}`} />
                            <span className="text-xs font-semibold text-content-primary">{s.title}</span>
                          </div>
                          <p className="text-xs text-content-secondary leading-relaxed">{s.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SOLICITUDES PENDIENTES ─────────────────────────────── */}
              {activeTab === "pending" && (
                <div className="space-y-5">
                  <div>
                    <h1 className="text-xl font-bold text-content-primary">Solicitudes de registro</h1>
                    <p className="text-xs text-content-secondary mt-0.5">Restaurantes en cola de validación y aprobación</p>
                  </div>

                  {pendingRestaurants.length === 0 ? (
                    <div className="bg-surface-card border border-surface-border rounded-card p-12 text-center">
                      <span className="text-3xl block mb-2">🎉</span>
                      <h3 className="font-semibold text-content-primary">Todo al día</h3>
                      <p className="text-xs text-content-secondary mt-1">No hay restaurantes pendientes de aprobación.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {pendingRestaurants.map((rest) => (
                        <div key={rest.id} className="bg-surface-card border border-surface-border rounded-card shadow-subtle overflow-hidden flex flex-col">
                          <div className="p-5 flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              {rest.logoUrl ? (
                                <img src={rest.logoUrl} alt="Logo" className="w-12 h-12 rounded-button object-cover border border-surface-border" />
                              ) : (
                                <div className="w-12 h-12 rounded-button bg-amber-100 border border-amber-200 flex items-center justify-center text-xl">🏪</div>
                              )}
                              <div>
                                <p className="font-semibold text-sm text-content-primary leading-tight">{rest.businessName}</p>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-button">
                                  Pendiente
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1 text-xs text-content-secondary">
                              <p><span className="font-medium text-content-primary">Responsable:</span> {rest.ownerName}</p>
                              <p><span className="font-medium text-content-primary">Dirección:</span> {rest.address}</p>
                              {rest.phoneNumber && <p><span className="font-medium text-content-primary">Teléfono:</span> {rest.phoneNumber}</p>}
                              {rest.description && <p className="line-clamp-2 mt-1 text-content-muted">{rest.description}</p>}
                            </div>
                          </div>

                          <div className="px-5 py-3 border-t border-surface-border flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(rest.id, true)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-button transition-colors shadow-subtle"
                            >
                              ✓ Aprobar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(rest.id, false)}
                              className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-2 rounded-button transition-colors"
                            >
                              ✕ Rechazar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── DIRECTORIO DE RESTAURANTES ─────────────────────────── */}
              {activeTab === "restaurants" && (
                <div className="space-y-5">
                  <div>
                    <h1 className="text-xl font-bold text-content-primary">Directorio de establecimientos</h1>
                    <p className="text-xs text-content-secondary mt-0.5">Restaurantes aprobados y activos en la plataforma</p>
                  </div>

                  <div className="bg-surface-card border border-surface-border rounded-card shadow-subtle overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-surface-border bg-surface-muted">
                            <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-content-muted px-4 py-3">Establecimiento</th>
                            <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-content-muted py-3">Dirección</th>
                            <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-content-muted py-3">Teléfono</th>
                            <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-content-muted py-3">Estado</th>
                            <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-content-muted px-4 py-3">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {allRestaurants.map((rest) => {
                            const isEnabled = rest.ownerEnabled !== false;
                            return (
                              <tr key={rest.id} className="hover:bg-surface-muted transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    {rest.logoUrl ? (
                                      <img src={rest.logoUrl} alt="" className="w-8 h-8 rounded-button object-cover border border-surface-border" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-button bg-surface-muted border border-surface-border flex items-center justify-center text-sm">🍽️</div>
                                    )}
                                    <div>
                                      <p className="font-medium text-content-primary text-xs">{rest.businessName}</p>
                                      <p className="text-[11px] text-content-muted">{rest.ownerName}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 text-xs text-content-secondary max-w-[180px] truncate">{rest.address}</td>
                                <td className="py-3 text-xs text-content-secondary">{rest.phoneNumber || "—"}</td>
                                <td className="py-3">
                                  {isEnabled ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-button">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                      Activo
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-button">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                                      Suspendido
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleSuspendRestaurant(rest)}
                                    className={`text-xs font-medium px-2.5 py-1 rounded-button border transition-colors ${
                                      isEnabled
                                        ? "text-red-600 hover:bg-red-50 border-red-200"
                                        : "text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                    }`}
                                  >
                                    {isEnabled ? "🚫 Suspender" : "✓ Reactivar"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {allRestaurants.length === 0 && (
                        <div className="text-center py-10 text-xs text-content-muted">No hay restaurantes aprobados aún.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── MODERACIÓN ─────────────────────────────────────────── */}
              {activeTab === "moderation" && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-xl font-bold text-content-primary">Moderación de cupones</h1>
                      <p className="text-xs text-content-secondary mt-0.5">Supervisa todas las promociones (activas, pausadas, vencidas y borradores)</p>
                    </div>

                    <select
                      aria-label="Filtrar promociones por estado"
                      value={promoStatusFilter}
                      onChange={(e) => setPromoStatusFilter(e.target.value)}
                      className="bg-white border border-surface-border rounded-button px-3 py-1.5 text-xs text-content-primary outline-none focus:border-brand-500 shadow-subtle"
                    >
                      <option value="ALL">Todos los estados ({allPromotions.length})</option>
                      <option value="ACTIVE">Activas ({allPromotions.filter((p) => p.status === "ACTIVE").length})</option>
                      <option value="DISABLED">Pausadas ({allPromotions.filter((p) => p.status === "DISABLED").length})</option>
                      <option value="EXPIRED">Vencidas ({allPromotions.filter((p) => p.status === "EXPIRED").length})</option>
                      <option value="DRAFT">Borradores ({allPromotions.filter((p) => p.status === "DRAFT").length})</option>
                    </select>
                  </div>

                  {allPromotions.filter((p) => promoStatusFilter === "ALL" || p.status === promoStatusFilter).length === 0 ? (
                    <div className="bg-surface-card border border-surface-border rounded-card p-10 text-center">
                      <p className="text-xs text-content-muted">No hay promociones para el filtro seleccionado.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {allPromotions
                        .filter((p) => promoStatusFilter === "ALL" || p.status === promoStatusFilter)
                        .map((promo) => {
                          const statusBadge =
                            promo.status === "ACTIVE"
                              ? { label: "Activa", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
                              : promo.status === "DISABLED"
                              ? { label: "Pausada", cls: "bg-amber-50 text-amber-700 border-amber-200" }
                              : promo.status === "EXPIRED"
                              ? { label: "Vencida", cls: "bg-red-50 text-red-700 border-red-200" }
                              : { label: "Borrador", cls: "bg-surface-muted text-content-secondary border-surface-border" };

                          return (
                            <div key={promo.id} className="bg-surface-card border border-surface-border rounded-card shadow-subtle overflow-hidden flex flex-col">
                              <div className="relative">
                                <img
                                  src={promo.imageUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=200&fit=crop"}
                                  alt={promo.title}
                                  className="w-full h-36 object-cover"
                                />
                                <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/60 text-white px-2 py-0.5 rounded-button">
                                  {promo.restaurantName}
                                </span>
                                <span className="absolute top-2 right-2 text-[10px] font-bold bg-brand-600 text-white px-2 py-0.5 rounded-button">
                                  {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}% OFF` : `$${Number(promo.discountValue).toLocaleString()}`}
                                </span>
                              </div>

                              <div className="p-4 flex-1 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-block font-mono text-[10px] bg-surface-muted border border-surface-border text-content-secondary px-2 py-0.5 rounded-button">
                                    {promo.code}
                                  </span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-button border ${statusBadge.cls}`}>
                                    {statusBadge.label}
                                  </span>
                                </div>
                                <p className="font-semibold text-sm text-content-primary leading-tight">{promo.title}</p>
                                <p className="text-xs text-content-secondary line-clamp-2">{promo.description || "Sin descripción."}</p>
                              </div>

                              <div className="px-4 py-3 border-t border-surface-border flex items-center justify-between">
                                <span className="text-[11px] text-content-muted">
                                  Canjes: <strong className="text-content-primary">{promo.currentRedemptions || 0}/{promo.maxRedemptions || "∞"}</strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePromotion(promo.id, promo.title)}
                                  className="text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-button transition-colors"
                                >
                                  Eliminar contenido
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
