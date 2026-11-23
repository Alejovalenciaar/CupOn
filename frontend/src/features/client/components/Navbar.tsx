import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconMenu, IconUser } from '@/components/Icons';

interface NavbarProps {
  currentUser: { email: string; role: string } | null;
  favoriteCount: number;
  onLogout: () => void;
}

export default function Navbar({ currentUser, favoriteCount, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Abrir menú de navegación"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-1.5 rounded-button text-content-secondary hover:bg-surface-muted"
          >
            <IconMenu size={18} />
          </button>
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo-cupon.svg"
              alt="CupOn"
              className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Navigation links (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-content-secondary">
          <a href="/#cupones" className="hover:text-brand-600 transition-colors py-1">
            Cupones
          </a>
          <a href="/#categorias" className="hover:text-brand-600 transition-colors py-1">
            Categorías
          </a>
          <a href="/#restaurantes" className="hover:text-brand-600 transition-colors py-1">
            Restaurantes
          </a>
          <Link
            to="/favorites"
            className="hover:text-brand-600 transition-colors flex items-center gap-1.5 py-1"
          >
            <span>Mis Favoritos</span>
            {favoriteCount > 0 && (
              <span className="bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold px-2 py-0.2 rounded-full tabular-nums">
                {favoriteCount}
              </span>
            )}
          </Link>
          {currentUser?.role === 'ROLE_CLIENTE' && (
            <>
              <Link to="/redemptions" className="hover:text-brand-600 transition-colors py-1">
                Mis Canjes
              </Link>
              <Link to="/profile" className="hover:text-brand-600 transition-colors py-1">
                Mi Perfil
              </Link>
            </>
          )}
        </nav>

        {/* Right actions: Auth */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              {currentUser.role === 'ROLE_ADMIN' && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-button border border-brand-200 transition-colors"
                >
                  <IconArrowLeft size={13} />
                  <span>Volver al panel</span>
                </Link>
              )}
              {currentUser.role === 'ROLE_RESTAURANTE' && (
                <Link
                  to="/restaurant"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-button border border-brand-200 transition-colors"
                >
                  <IconArrowLeft size={13} />
                  <span>Volver al panel</span>
                </Link>
              )}
              {currentUser.role === 'ROLE_CLIENTE' ? (
                <Link
                  to="/profile"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs text-content-secondary hover:text-brand-600 bg-surface-muted hover:bg-surface-border px-2.5 py-1 rounded-button border border-surface-border transition-colors"
                  title="Ir a mi perfil"
                >
                  <IconUser size={13} />
                  <span>{currentUser.email}</span>
                </Link>
              ) : (
                <span className="hidden sm:inline-block text-xs text-content-secondary bg-surface-muted px-2.5 py-1 rounded-button border border-surface-border">
                  {currentUser.email}
                </span>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="text-xs font-medium text-content-secondary hover:text-brand-600 px-3 py-1.5 rounded-button border border-surface-border hover:bg-surface-muted transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs sm:text-sm font-medium text-content-secondary hover:text-content-primary px-3.5 py-1.5 rounded-button border border-surface-border hover:bg-surface-muted transition-colors"
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => navigate('/register/client')}
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-medium px-4 py-1.5 rounded-button shadow-subtle transition-colors"
              >
                Registrarme
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Menú desplegable móvil */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-surface-border bg-surface-card px-4 py-3 space-y-1 text-sm font-medium text-content-secondary">
          <a
            href="/#cupones"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-button hover:bg-surface-muted hover:text-content-primary"
          >
            Cupones
          </a>
          <a
            href="/#categorias"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-button hover:bg-surface-muted hover:text-content-primary"
          >
            Categorías
          </a>
          <a
            href="/#restaurantes"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-button hover:bg-surface-muted hover:text-content-primary"
          >
            Restaurantes
          </a>
          <Link
            to="/favorites"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-button hover:bg-surface-muted hover:text-content-primary"
          >
            <span>Mis Favoritos</span>
            {favoriteCount > 0 && (
              <span className="bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold px-2 py-0.2 rounded-full tabular-nums">
                {favoriteCount}
              </span>
            )}
          </Link>
          {currentUser?.role === 'ROLE_CLIENTE' && (
            <>
              <Link
                to="/redemptions"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-button hover:bg-surface-muted hover:text-content-primary"
              >
                Mis Canjes
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-button hover:bg-surface-muted hover:text-content-primary"
              >
                Mi Perfil
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
