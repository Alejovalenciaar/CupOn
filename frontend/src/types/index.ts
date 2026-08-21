// --- API Response wrappers ---
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// --- Auth ---
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterClientRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterRestaurantRequest extends RegisterClientRequest {
  businessName: string;
  description?: string;
  address: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: 'ROLE_CLIENTE' | 'ROLE_RESTAURANTE' | 'ROLE_ADMIN';
}

// --- User ---
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  enabled: boolean;
  createdAt: string;
}

// --- Restaurant ---
export interface Restaurant {
  id: string;
  businessName: string;
  description: string;
  address: string;
  logoUrl: string;
  phoneNumber: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  ownerName: string;
  createdAt: string;
}

// --- Promotion ---
export interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minPurchase: number;
  startDate: string;
  endDate: string;
  maxRedemptions: number;
  currentRedemptions: number;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'DISABLED';
  imageUrl: string;
  restaurantName: string;
  restaurantId: string;
  categories: string[];
  createdAt: string;
}

// --- Admin ---
export interface SystemMetrics {
  totalUsers: number;
  totalRestaurants: number;
  pendingApprovals: number;
  totalPromotions: number;
  activePromotions: number;
}
