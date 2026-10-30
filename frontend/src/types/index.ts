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


export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
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


export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  enabled: boolean;
  createdAt: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface UpdateRestaurantRequest {
  businessName?: string;
  description?: string;
  address?: string;
  logoUrl?: string;
  phoneNumber?: string;
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

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface CreatePromotionRequest {
  title: string;
  description?: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minPurchase?: number;
  startDate: string;
  endDate: string;
  maxRedemptions?: number;
  imageUrl?: string;
  categoryIds?: string[];
  daysOfWeek?: string[];
  /** Hora diaria "HH:mm"; null junto con endTime = todo el día */
  startTime?: string | null;
  endTime?: string | null;
}

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
  viewCount: number;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'DISABLED';
  imageUrl: string;
  restaurantName: string;
  restaurantId: string;
  categories: string[];
  createdAt: string;
  daysOfWeek?: string[];
  startTime?: string | null;
  endTime?: string | null;
}

// --- Admin ---
export interface ApproveRestaurantRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface SystemMetrics {
  totalUsers: number;
  totalRestaurants: number;
  pendingApprovals: number;
  totalPromotions: number;
  activePromotions: number;
}

// --- Redemption ---
export interface PromotionStats {
  active: number;
  paused: number;
  expired: number;
  totalViews: number;
}

export interface RedemptionResponse {
  promotionId: string;
  promotionTitle: string;
  code: string;
  remainingRedemptions: number; // -1 = ilimitado
  redeemedAt: string;
}

// --- Chatbot ---
export interface ChatRequest {
  pregunta: string;
}

export interface ChatResponse {
  respuesta: string;
}
