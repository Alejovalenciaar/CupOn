import {
    ApiResponse,
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterClientRequest,
    RegisterRestaurantRequest,
    ResetPasswordRequest,
} from "@/types";
import apiClient from "./client";

/**
 * Registrar un nuevo usuario con rol CLIENTE
 */
export const registerClient = async (request: RegisterClientRequest):
    Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
        "/auth/register/client",
        request
    );
    return response.data.data;
};

/**
 * Registrar un nuevo usuario con rol RESTAURANTE (queda en estado PENDING)
 */
export const registerRestaurant = async (request: RegisterRestaurantRequest):
    Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
        "/auth/register/restaurant",
        request
    );
    return response.data.data;
};

/**
 * Iniciar sesión con correo y contraseña
 */
export const login = async (request: LoginRequest):
    Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
        "/auth/login",
        request
    );
    return response.data.data;
};

/**
 * Solicitar recuperación de contraseña (envía token por correo) — HU 1.3
 */
export const forgotPassword = async (request: ForgotPasswordRequest): Promise<void> => {
    await apiClient.post<ApiResponse<void>>("/auth/forgot-password", request);
};

/**
 * Restablecer contraseña usando el token recibido por correo — HU 1.3
 */
export const resetPassword = async (request: ResetPasswordRequest): Promise<void> => {
    await apiClient.post<ApiResponse<void>>("/auth/reset-password", request);
};






