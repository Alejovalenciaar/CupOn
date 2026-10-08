import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-surface-card border-t border-surface-border mt-16 text-content-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo y Slogan */}
          <div className="md:col-span-2 space-y-3">
            <img src="/logo-cupon.svg" alt="CupOn" className="h-8 w-auto" />
            <p className="text-sm font-medium text-brand-600">
              "La semana sabe mejor con CupOn."
            </p>
            <p className="text-xs text-content-secondary max-w-sm leading-relaxed">
              La plataforma gastronómica que conecta a comensales con las mejores experiencias culinarias, cafés de especialidad y descuentos exclusivos.
            </p>
          </div>

          {/* Enlaces de interés */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-content-primary mb-3">
              Explorar
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#cupones" className="hover:text-brand-600 transition-colors">
                  Cupones vigentes
                </a>
              </li>
              <li>
                <a href="#categorias" className="hover:text-brand-600 transition-colors">
                  Categorías y especialidades
                </a>
              </li>
              <li>
                <a href="#restaurantes" className="hover:text-brand-600 transition-colors">
                  Restaurantes aliados
                </a>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-brand-600 transition-colors">
                  Mis favoritos
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Restaurantes */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-content-primary mb-3">
              Para Restaurantes
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/register/restaurant"
                  className="hover:text-brand-600 transition-colors font-medium text-brand-600"
                >
                  Afiliar mi restaurante →
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-600 transition-colors">
                  Portal de socios
                </Link>
              </li>
              <li>
                <span className="text-content-muted">Términos del servicio</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-content-muted">
          <p>© {new Date().getFullYear()} CupOn. Todos los derechos reservados.</p>
          <p className="italic">La semana sabe mejor con CupOn.</p>
        </div>
      </div>
    </footer>
  );
}
