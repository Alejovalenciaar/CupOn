import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerClient } from "@/api/authServices";
import { useAuth } from "@/context/AuthContext";
import type { RegisterClientRequest } from "@/types";

export default function RegisterClientPage() {
  const navigate = useNavigate();
  const { loginSession } = useAuth();
  const [form, setForm] = useState<RegisterClientRequest>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await registerClient(form);
      loginSession(data);
      setSuccess("¡Cuenta creada exitosamente! Bienvenido a CupOn.");
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Ocurrió un error al registrar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block group">
          <img src="/logo-cupon.svg" alt="CupOn" className="h-9 w-auto mx-auto" />
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-content-primary">
          Crea tu cuenta de comensal
        </h2>
        <p className="mt-1 text-xs text-content-secondary">
          "La semana sabe mejor con CupOn."
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface-card py-8 px-6 sm:px-10 border border-surface-border rounded-card shadow-subtle">
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-button mb-4">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-button mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Nombre
                </label>
                <input
                  id="register-client-firstname"
                  type="text"
                  required
                  autoComplete="given-name"
                  placeholder="Carlos"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500 shadow-subtle"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Apellido
                </label>
                <input
                  id="register-client-lastname"
                  type="text"
                  required
                  autoComplete="family-name"
                  placeholder="Gómez"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500 shadow-subtle"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Correo electrónico
              </label>
              <input
                id="register-client-email"
                type="email"
                required
                autoComplete="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500 shadow-subtle"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="register-client-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white border border-surface-border rounded-button px-3 py-2 pr-10 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500 shadow-subtle"
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

            <button
              id="register-client-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-button transition-colors shadow-subtle mt-2"
            >
              {loading ? "Creando cuenta..." : "Crear mi cuenta"}
            </button>
          </form>

          <div className="pt-4 mt-4 border-t border-surface-border text-center text-xs text-content-secondary space-y-2">
            <p>
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold">
                Inicia sesión aquí
              </Link>
            </p>
            <p>
              ¿Tienes un negocio gastronómico?{" "}
              <Link
                to="/register/restaurant"
                className="text-accent-700 hover:text-accent-800 font-semibold"
              >
                Regístralo como aliado
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
