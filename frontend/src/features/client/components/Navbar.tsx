import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  currentUser: { email: string; role: string } | null;
  favoriteCount: number;
  onLogout: () => void;
}

export default function Navbar({ currentUser, favoriteCount, onLogout }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo-cupon.svg"
            alt="CupOn"
            className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-content-secondary">
          <a
            href="#cupones"
            className="hover:text-brand-600 transition-colors py-1"
          >
            Cupones
          </a>
          <a
            href="#categorias"
            className="hover:text-brand-600 transition-colors py-1"
          >
            Categorías
          </a>
          <a
            href="#restaurantes"
            className="hover:text-brand-600 transition-colors py-1"
          >
            Restaurantes
          </a>
          <Link
            to="/favorites"
            className="hover:text-brand-600 transition-colors flex items-center gap-1.5 py-1"
          >
            <span>Mis Favoritos</span>
            {favoriteCount > 0 && (
              <span className="bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold px-2 py-0.2 rounded-full">
                {favoriteCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Right actions: Auth */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs text-content-secondary bg-surface-muted px-2.5 py-1 rounded-button border border-surface-border">
                {currentUser.email}
              </span>
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
    </header>
  );
}
