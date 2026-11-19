import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, updateMyProfile } from "@/api/userServices";
import { UserProfileResponse, UpdateUserRequest } from "@/types";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function ProfilePage() {
  const navigate = useNavigate();

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("cupon_user") || "null");
    } catch {
      return null;
    }
  })();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Formulario editable
  const [formData, setFormData] = useState<UpdateUserRequest>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      setProfile(data);
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phoneNumber: data.phoneNumber || "",
      });
    } catch (err: any) {
      showToast(err.response?.data?.message || "Error al cargar la información del perfil.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones en cliente
    if (!formData.firstName?.trim() || formData.firstName.trim().length < 2) {
      showToast("El nombre debe tener al menos 2 caracteres.", "error");
      return;
    }
    if (!formData.lastName?.trim() || formData.lastName.trim().length < 2) {
      showToast("El apellido debe tener al menos 2 caracteres.", "error");
      return;
    }
    if (formData.phoneNumber && !/^[0-9+()\-\s]{7,20}$/.test(formData.phoneNumber.trim())) {
      showToast("El formato del teléfono no es válido (ej. +57 300 123 4567).", "error");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateMyProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber?.trim() || undefined,
      });

      setProfile(updated);
      showToast("¡Tu perfil ha sido actualizado con éxito!");

      // Actualizar localStorage si tenía datos del usuario
      if (currentUser) {
        localStorage.setItem(
          "cupon_user",
          JSON.stringify({ ...currentUser, firstName: updated.firstName, lastName: updated.lastName })
        );
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "No se pudo actualizar el perfil.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cupon_user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary antialiased flex flex-col">
      <Navbar currentUser={currentUser} favoriteCount={0} onLogout={handleLogout} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 space-y-6">
        {/* Cabecera de navegación rápida */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs text-content-secondary hover:text-content-primary flex items-center gap-1 font-medium"
            >
              ← Volver al catálogo
            </button>
            <span className="text-surface-border">/</span>
            <h1 className="text-xl font-bold tracking-tight text-content-primary">Mi Perfil</h1>
          </div>
        </div>

        {/* Notificación Toast */}
        {toast && (
          <div
            className={`p-4 rounded-button text-sm border flex items-center justify-between ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <span>{toast.msg}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-xs font-bold ml-4 hover:opacity-75"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-surface-card border border-surface-border rounded-card p-12 text-center text-content-muted">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Cargando tus datos de perfil...</p>
          </div>
        ) : (
          <div className="bg-surface-card border border-surface-border rounded-card p-6 sm:p-8 shadow-subtle space-y-6">
            {/* Header del perfil */}
            <div className="flex items-center gap-4 pb-6 border-b border-surface-border">
              <div className="w-16 h-16 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-2xl font-bold text-brand-700">
                {profile?.firstName ? profile.firstName.charAt(0).toUpperCase() : "👤"}
              </div>
              <div>
                <h2 className="text-lg font-bold text-content-primary">
                  {profile ? `${profile.firstName} ${profile.lastName}` : "Cliente CupOn"}
                </h2>
                <p className="text-xs text-content-secondary">{profile?.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-button">
                    Cliente verificado
                  </span>
                  {profile?.createdAt && (
                    <span className="text-[11px] text-content-muted">
                      Miembro desde {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Carlos"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary outline-none focus:border-brand-500 shadow-subtle"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Gómez"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary outline-none focus:border-brand-500 shadow-subtle"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ""}
                  className="w-full bg-surface-muted border border-surface-border rounded-button px-3 py-2 text-sm text-content-muted cursor-not-allowed"
                />
                <p className="text-[11px] text-content-muted mt-1">
                  El correo electrónico no puede ser modificado ya que está vinculado a tu cuenta.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Número de teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+57 300 123 4567"
                  value={formData.phoneNumber || ""}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary outline-none focus:border-brand-500 shadow-subtle"
                />
                <p className="text-[11px] text-content-muted mt-1">
                  Utilizado para coordinar pedidos o reservas con los restaurantes.
                </p>
              </div>

              <div className="pt-4 border-t border-surface-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-xs font-medium text-content-secondary border border-surface-border bg-white hover:bg-surface-muted px-4 py-2 rounded-button transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-button transition-colors shadow-subtle flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
