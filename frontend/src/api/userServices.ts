import apiClient from "./client";
import { ApiResponse, UserProfileResponse, UpdateUserRequest } from "@/types";

/**
 * Obtiene el perfil del usuario autenticado (HU 1.4)
 */
export const getMyProfile = async (): Promise<UserProfileResponse> => {
  const response = await apiClient.get<ApiResponse<UserProfileResponse>>("/users/me");
  return response.data.data;
};

/**
 * Actualiza los datos de perfil de un cliente (HU 1.4)
 */
export const updateMyProfile = async (
  request: UpdateUserRequest
): Promise<UserProfileResponse> => {
  const response = await apiClient.put<ApiResponse<UserProfileResponse>>("/users/me", request);
  return response.data.data;
};
