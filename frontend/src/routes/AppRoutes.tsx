import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Auth
import LoginPage from '../features/auth/LoginPage';
import RegisterClientPage from '../features/auth/RegisterClientPage';
import RegisterRestaurantPage from '../features/auth/RegisterRestaurantPage';

// Client
import CatalogPage from '../features/client/CatalogPage';
import FavoritesPage from '../features/client/FavoritesPage';
import ProfilePage from '../features/client/ProfilePage';

// Restaurant
import RestaurantDashboard from '../features/restaurant/RestaurantDashboard';

// Admin
import AdminDashboard from '../features/admin/AdminDashboard';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<CatalogPage />} />
      <Route path="/promo/:id" element={<CatalogPage />} />
      <Route path="/login" element={<LoginPage />} />
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
    </Routes>
  );
}
