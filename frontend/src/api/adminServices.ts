import apiClient from "./client";
import { ApiResponse, PageResponse, Restaurant, SystemMetrics, ApproveRestaurantRequest } from "@/types";

/**
 * Obtiene métricas generales del sistema (HU 6.5)
 */
export const getSystemMetrics = async (): Promise<SystemMetrics> => {
  const response = await apiClient.get<ApiResponse<SystemMetrics>>("/admin/metrics");
  return response.data.data;
};

/**
 * Lista restaurantes pendientes de aprobación (HU 6.1)
 */
export const getPendingRestaurants = async (
  page = 0,
  size = 20
): Promise<PageResponse<Restaurant>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<Restaurant>>>(
    `/admin/restaurants/pending?page=${page}&size=${size}`
  );
  return response.data.data;
};

/**
 * Aprueba o rechaza un restaurante (HU 6.1)
 */
export const approveRestaurant = async (
  id: string,
  request: ApproveRestaurantRequest
): Promise<void> => {
  await apiClient.put<ApiResponse<void>>(`/admin/restaurants/${id}/approve`, request);
};

/**
 * Suspende o reactiva una cuenta de usuario (HU 6.2)
 */
export const suspendUser = async (id: string): Promise<void> => {
  await apiClient.put<ApiResponse<void>>(`/admin/users/${id}/suspend`);
};

/**
 * Elimina una promoción por moderación administrativa (HU 6.4)
 */
export const deletePromotionByAdmin = async (id: string): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/admin/promotions/${id}`);
};
