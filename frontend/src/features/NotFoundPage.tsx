import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary antialiased flex flex-col items-center justify-center px-4 text-center">
      <Link to="/" className="mb-8">
        <img src="/logo-cupon.svg" alt="CupOn" className="h-10 w-auto object-contain" />
      </Link>
      <p className="text-6xl font-extrabold tracking-tight text-brand-600">404</p>
      <h1 className="mt-3 text-xl font-bold text-content-primary">Esta página no existe</h1>
      <p className="mt-1 text-sm text-content-secondary max-w-sm">
        Puede que el enlace esté mal escrito o que el cupón ya no esté disponible.
      </p>
      <Link
        to="/"
        className="mt-6 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-button shadow-subtle transition-colors"
      >
        Ir al catálogo
      </Link>
    </div>
  );
}
