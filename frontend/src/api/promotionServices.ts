import { ApiResponse, PageResponse, Promotion, CreatePromotionRequest, RedemptionResponse } from "@/types";
import apiClient from "./client";

/**
 * Obtiene la lista de promociones activas paginada
 * @param search Término de búsqueda opcional
 * @param page Número de página (inicia en 0)
 * @param size Cantidad de promociones por página
 */
export const getPromotions = async (
  search?: string,
  page = 0,
  size = 10
): Promise<PageResponse<Promotion>> => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page.toString());
  params.append("size", size.toString());

  const response = await apiClient.get<ApiResponse<PageResponse<Promotion>>>(
    `/promotions?${params.toString()}`
  );
  return response.data.data;
};

/**
 * Obtiene el detalle de una promoción por su ID
 */
export const getPromotionById = async (id: string): Promise<Promotion> => {
  const response = await apiClient.get<ApiResponse<Promotion>>(`/promotions/${id}`);
  return response.data.data;
};

/**
 * Obtiene las promociones creadas por el restaurante autenticado (HU 4)
 */
export const getMyPromotions = async (
  page = 0,
  size = 20
): Promise<PageResponse<Promotion>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<Promotion>>>(
    `/promotions/mine?page=${page}&size=${size}`
  );
  return response.data.data;
};

/**
 * Crea una nueva promoción (HU 4.1)
 */
export const createPromotion = async (
  request: CreatePromotionRequest
): Promise<Promotion> => {
  const response = await apiClient.post<ApiResponse<Promotion>>(
    "/promotions",
    request
  );
  return response.data.data;
};

/**
 * Actualiza una promoción existente (HU 4.2)
 */
export const updatePromotion = async (
  id: string,
  request: CreatePromotionRequest
): Promise<Promotion> => {
  const response = await apiClient.put<ApiResponse<Promotion>>(
    `/promotions/${id}`,
    request
  );
  return response.data.data;
};

/**
 * Elimina una promoción (HU 4.3)
 */
export const deletePromotion = async (id: string): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/promotions/${id}`);
};

/**
 * Actualiza el estado (ACTIVE o DISABLED) de una promoción (HU 4.4)
 */
export const updatePromotionStatus = async (
  id: string,
  status: "ACTIVE" | "DISABLED"
): Promise<Promotion> => {
  const response = await apiClient.patch<ApiResponse<Promotion>>(
    `/promotions/${id}/status`,
    { status }
  );
  return response.data.data;
};

/**
 * Alterna el estado de favorito de una promoción para el cliente autenticado (HU 15)
 * Requiere rol ROLE_CLIENTE
 */
export const toggleFavorite = async (id: string): Promise<void> => {
  await apiClient.post<ApiResponse<void>>(`/promotions/${id}/favorite`);
};

/**
 * Obtiene las promociones favoritas del cliente autenticado (HU 15)
 * Requiere rol ROLE_CLIENTE
 */
export const getMyFavorites = async (
  page = 0,
  size = 50
): Promise<PageResponse<Promotion>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<Promotion>>>(
    `/promotions/favorites?page=${page}&size=${size}`
  );
  return response.data.data;
};

/**
 * Canjea un cupón incrementando su contador de redenciones (HU Canje) — POST /promotions/{id}/redeem
 * Es público — no requiere autenticación.
 */
export const redeemPromotion = async (id: string): Promise<RedemptionResponse> => {
  const response = await apiClient.post<ApiResponse<RedemptionResponse>>(
    `/promotions/${id}/redeem`
  );
  return response.data.data;
};
