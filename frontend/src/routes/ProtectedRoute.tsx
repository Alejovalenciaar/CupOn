import { Navigate, useLocation } from 'react-router-dom';
import type { AuthResponse } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AuthResponse['role'][];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('cupon_user');


  if (!token || !userStr) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles) {
    try {
      const user: AuthResponse = JSON.parse(userStr);
      if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
      }
    } catch {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}
