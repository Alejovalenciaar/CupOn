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
  instagramUrl?: string;
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
  cuisineType?: string;
  description?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  logoUrl?: string;
  phoneNumber?: string;
  instagramUrl?: string;
}

// --- Restaurant ---
export interface Restaurant {
  id: string;
  businessName: string;
  description: string;
  cuisineType?: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  logoUrl: string;
  phoneNumber: string;
  instagramUrl?: string | null;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  userId?: string;
  ownerEnabled?: boolean;
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
  restaurantInstagramUrl?: string | null;
  categories: string[];
  daysOfWeek?: string[];
  startTime?: string | null;
  endTime?: string | null;
  currentlyActive?: boolean;
  createdAt: string;
}

// --- Admin ---
export interface ApproveRestaurantRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface TopRestaurantMetric {
  restaurantId: string;
  businessName: string;
  cuisineType?: string;
  activePromotions: number;
  totalRedemptions: number;
}

export interface SystemMetrics {
  totalUsers: number;
  totalRestaurants: number;
  pendingApprovals: number;
  totalPromotions: number;
  activePromotions: number;
  totalRedemptions?: number;
  topRestaurants?: TopRestaurantMetric[];
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
  verificationCode: string;
  remainingRedemptions: number; // -1 = ilimitado
  redeemedAt: string;
}

export interface RedemptionHistoryItem {
  id: string;
  promotionId: string;
  promotionTitle: string;
  restaurantName: string;
  code: string;
  verificationCode: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  customerEmail?: string | null;
  verified: boolean;
  verifiedAt?: string | null;
  redeemedAt: string;
}

// --- Chatbot ---
export interface ChatRequest {
  pregunta: string;
}

export interface ChatResponse {
  respuesta: string;
}

// ---- Files / Upload ----
export interface FileUploadResponse {
  url: string;
  publicId: string;
  format: string;
  size: number; // tamaño en bytes por el backend 
  width: number;
  height: number;
}
