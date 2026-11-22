import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, forgotPassword, resetPassword } from "@/api/authServices";
import { useAuth } from "@/context/AuthContext";
import type { LoginRequest } from "@/types";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loginSession } = useAuth();

  // ---------- Login ----------
  const [form, setForm] = useState<LoginRequest>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ---------- Forgot password ----------
  const [view, setView] = useState<"login" | "forgot" | "reset">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      // Enlace del correo de recuperación (/reset-password?token=...): mostrar el formulario
      // aunque haya una sesión guardada, en vez de redirigir al panel.
      setResetToken(tokenParam);
      setView("reset");
      return;
    }
    if (user) {
      if (user.role === "ROLE_RESTAURANTE") navigate("/restaurant");
      else if (user.role === "ROLE_ADMIN") navigate("/admin");
      else navigate("/");
    }
  }, [navigate, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await login(form);
      loginSession(data);
      if (data.role === "ROLE_RESTAURANTE") navigate("/restaurant");
      else if (data.role === "ROLE_ADMIN") navigate("/admin");
      else navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Credenciales incorrectas o cuenta inactiva.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    try {
      await forgotPassword({ email: forgotEmail });
      setForgotSuccess("Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.");
    } catch (err: any) {
      setForgotError(err.response?.data?.message || "Ocurrió un error al procesar la solicitud.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    try {
      await resetPassword({ token: resetToken, newPassword });
      setForgotSuccess("¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión.");
      setTimeout(() => {
        setView("login");
        setForgotSuccess(null);
        setResetToken("");
        setNewPassword("");
        window.history.replaceState({}, "", "/login");
      }, 2500);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || "El token es inválido o ha expirado.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block group">
          <img src="/logo-cupon.svg" alt="CupOn" className="h-9 w-auto mx-auto" />
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-content-primary">
          {view === "login"
            ? "Bienvenido de nuevo"
            : view === "forgot"
            ? "Recuperar contraseña"
            : "Establecer nueva contraseña"}
        </h2>
        <p className="mt-1 text-xs text-content-secondary">
          "La semana sabe mejor con CupOn."
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface-card py-8 px-6 sm:px-10 border border-surface-border rounded-card shadow-subtle">
          {/* VISTA LOGIN */}
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-button">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Correo electrónico
                </label>
                <input
                  id="login-email"
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-content-primary">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-white border border-surface-border rounded-button px-3 py-2 pr-10 text-sm text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500 shadow-subtle"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-content-muted hover:text-content-primary"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-button transition-colors shadow-subtle mt-2"
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>

              <div className="pt-4 border-t border-surface-border text-center text-xs text-content-secondary space-y-2">
                <p>
                  ¿No tienes una cuenta aún?{" "}
                  <Link
                    to="/register/client"
                    className="text-brand-600 hover:text-brand-700 font-semibold"
                  >
                    Regístrate aquí
                  </Link>
                </p>
                <p>
                  ¿Eres dueño de un local?{" "}
                  <Link
                    to="/register/restaurant"
                    className="text-accent-700 hover:text-accent-800 font-semibold"
                  >
                    Afiliar mi restaurante
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* VISTA FORGOT */}
          {view === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              {forgotSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-button">
                  {forgotSuccess}
                </div>
              )}
              {forgotError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-button">
                  {forgotError}
                </div>
              )}
              <p className="text-xs text-content-secondary">
                Ingresa el correo asociado a tu cuenta para enviarte las instrucciones de restablecimiento.
              </p>
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Correo electrónico
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm text-content-primary outline-none focus:border-brand-500 shadow-subtle"
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm py-2 rounded-button transition-colors shadow-subtle"
              >
                {forgotLoading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>

              <div className="flex items-center justify-between pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => setView("reset")}
                  className="text-brand-600 font-medium hover:underline"
                >
                  Ya tengo un token →
                </button>
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="text-content-secondary hover:underline"
                >
                  ← Volver a inicio
                </button>
              </div>
            </form>
          )}

          {/* VISTA RESET */}
          {view === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              {forgotSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-button">
                  {forgotSuccess}
                </div>
              )}
              {forgotError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-button">
                  {forgotError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Token de verificación
                </label>
                <input
                  id="reset-token"
                  type="text"
                  required
                  placeholder="Pega el token aquí"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-sm font-mono text-content-primary outline-none focus:border-brand-500 shadow-subtle"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="reset-password"
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white border border-surface-border rounded-button px-3 py-2 pr-10 text-sm text-content-primary outline-none focus:border-brand-500 shadow-subtle"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-content-muted"
                  >
                    {showNewPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm py-2 rounded-button transition-colors shadow-subtle"
              >
                {forgotLoading ? "Guardando..." : "Actualizar contraseña"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="text-xs text-content-secondary hover:underline"
                >
                  ← Cancelar y volver al login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
