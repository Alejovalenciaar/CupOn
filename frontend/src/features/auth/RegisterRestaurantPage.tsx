import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerRestaurant } from "@/api/authServices";
import type { RegisterRestaurantRequest } from "@/types";

export default function RegisterRestaurantPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterRestaurantRequest>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    businessName: "",
    address: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await registerRestaurant(form);
      setSuccess(
        "¡Solicitud de registro enviada! Tu perfil se encuentra en revisión. Te notificaremos una vez que el equipo valide los datos comerciales."
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Ocurrió un error al registrar el restaurante.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface-canvas text-content-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <img src="/logo-cupon.svg" alt="CupOn" className="h-9 w-auto mx-auto mb-4" />
          <div className="bg-surface-card p-8 border border-surface-border rounded-card shadow-subtle text-center space-y-4">
            <span className="text-4xl block">✨</span>
            <h2 className="text-xl font-bold text-content-primary">
              ¡Solicitud recibida con éxito!
            </h2>
            <p className="text-xs text-content-secondary leading-relaxed">
              {success}
            </p>
            <div className="bg-accent-50 border border-accent-100 rounded-card p-3 text-xs text-accent-700">
              Tiempo estimado de validación: 24 a 48 horas hábiles.
            </div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs py-2 rounded-button transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block group">
          <img src="/logo-cupon.svg" alt="CupOn" className="h-9 w-auto mx-auto" />
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-content-primary">
          Afiliar restaurante o cafetería
        </h2>
        <p className="mt-1 text-xs text-content-secondary">
          "La semana sabe mejor con CupOn."
        </p>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <span
            className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center border ${
              step === 1
                ? "bg-brand-600 text-white border-brand-600 shadow-subtle"
                : "bg-surface-muted text-content-secondary border-surface-border"
            }`}
          >
            1
          </span>
          <div className="w-8 h-0.5 bg-surface-border"></div>
          <span
            className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center border ${
              step === 2
                ? "bg-brand-600 text-white border-brand-600 shadow-subtle"
                : "bg-surface-muted text-content-secondary border-surface-border"
            }`}
          >
            2
          </span>
        </div>
        <div className="text-[11px] text-content-muted mt-1">
          {step === 1 ? "Paso 1: Datos del establecimiento" : "Paso 2: Responsable de la cuenta"}
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface-card py-8 px-6 sm:px-10 border border-surface-border rounded-card shadow-subtle">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-button mb-4">
              ⚠️ {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Nombre comercial del restaurante *
                </label>
                <input
                  id="register-restaurant-businessname"
                  type="text"
                  required
                  placeholder="Ej. Café Bistró San Pedro"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500 shadow-subtle"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Dirección del local *
                </label>
                <input
                  id="register-restaurant-address"
                  type="text"
                  required
                  placeholder="Ej. Carrera 7 # 72-10"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500 shadow-subtle"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Especialidad / Descripción breve
                </label>
                <textarea
                  id="register-restaurant-description"
                  rows={3}
                  placeholder="Cafetería de especialidad, panadería artesanal y desayunos..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500 shadow-subtle resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm py-2.5 rounded-button transition-colors shadow-subtle mt-2"
              >
                Siguiente paso →
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Nombre del dueño *
                  </label>
                  <input
                    id="register-restaurant-firstname"
                    type="text"
                    required
                    placeholder="Andrés"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary outline-none focus:border-brand-500 shadow-subtle"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Apellido *
                  </label>
                  <input
                    id="register-restaurant-lastname"
                    type="text"
                    required
                    placeholder="Mora"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary outline-none focus:border-brand-500 shadow-subtle"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Correo electrónico para acceso *
                </label>
                <input
                  id="register-restaurant-email"
                  type="email"
                  required
                  placeholder="contacto@restaurante.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary outline-none focus:border-brand-500 shadow-subtle"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    id="register-restaurant-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-white border border-surface-border rounded-button px-3 py-2 pr-10 text-sm text-content-primary outline-none focus:border-brand-500 shadow-subtle"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-content-muted"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-white hover:bg-surface-muted text-content-secondary border border-surface-border font-medium text-sm py-2 rounded-button transition-colors"
                >
                  ← Atrás
                </button>
                <button
                  id="register-restaurant-submit"
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium text-sm py-2 rounded-button transition-colors shadow-subtle"
                >
                  {loading ? "Enviando..." : "Completar registro"}
                </button>
              </div>
            </form>
          )}

          <div className="pt-4 mt-4 border-t border-surface-border text-center text-xs text-content-secondary">
            ¿Ya tienes una cuenta de restaurante?{" "}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
