import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Ruta principal cargada de inmediato
import CatalogPage from '../features/client/CatalogPage';

// Rutas secundarias con code splitting (React.lazy)
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const RegisterClientPage = lazy(() => import('../features/auth/RegisterClientPage'));
const RegisterRestaurantPage = lazy(() => import('../features/auth/RegisterRestaurantPage'));
const FavoritesPage = lazy(() => import('../features/client/FavoritesPage'));
const ProfilePage = lazy(() => import('../features/client/ProfilePage'));
const RedemptionsPage = lazy(() => import('../features/client/RedemptionsPage'));
const RestaurantDetailPage = lazy(() => import('../features/client/RestaurantDetailPage'));
const RestaurantDashboard = lazy(() => import('../features/restaurant/RestaurantDashboard'));
const AdminDashboard = lazy(() => import('../features/admin/AdminDashboard'));
const NotFoundPage = lazy(() => import('../features/NotFoundPage'));

const PageLoader = () => (
  <div className="min-h-screen bg-surface-canvas flex items-center justify-center">
    <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<CatalogPage />} />
        <Route path="/promo/:id" element={<CatalogPage />} />
        <Route path="/restaurante/:id" element={<RestaurantDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Enlace del correo de recuperación de contraseña (AuthServiceImpl.forgotPassword) */}
        <Route path="/reset-password" element={<LoginPage />} />
        <Route path="/register/client" element={<RegisterClientPage />} />
        <Route path="/register/restaurant" element={<RegisterRestaurantPage />} />

        {/* Client (protected) */}
        <Route
          path="/favorites"
          element={
            <ProtectedRoute allowedRoles={['ROLE_CLIENTE']}>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/redemptions"
          element={
            <ProtectedRoute allowedRoles={['ROLE_CLIENTE']}>
              <RedemptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['ROLE_CLIENTE']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Restaurant (protected) */}
        <Route
          path="/restaurant/*"
          element={
            <ProtectedRoute allowedRoles={['ROLE_RESTAURANTE']}>
              <RestaurantDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin (protected) */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
