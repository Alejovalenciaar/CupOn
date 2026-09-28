import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterClientRequest,
  RegisterRestaurantRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@/types";
import apiClient from "./client";

/**
 * Registra un nuevo usuario con rol CLIENTE
 */
export const registerClient = async (
  request: RegisterClientRequest
): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    "/auth/register/client",
    request
  );
  return response.data.data;
};

/**
 * Registra un nuevo usuario con rol RESTAURANTE (queda en estado PENDING)
 */
export const registerRestaurant = async (
  request: RegisterRestaurantRequest
): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    "/auth/register/restaurant",
    request
  );
  return response.data.data;
};

/**
 * Inicia sesión con correo y contraseña
 */
export const login = async (request: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    "/auth/login",
    request
  );
  return response.data.data;
};

/**
 * Solicita enlace o token para recuperar contraseña (HU 1.3)
 */
export const forgotPassword = async (
  request: ForgotPasswordRequest
): Promise<void> => {
  await apiClient.post<ApiResponse<void>>("/auth/forgot-password", request);
};

/**
 * Restablece la contraseña con el token (HU 1.3)
 */
export const resetPassword = async (
  request: ResetPasswordRequest
): Promise<void> => {
  await apiClient.post<ApiResponse<void>>("/auth/reset-password", request);
};
