import { ApiResponse, PageResponse, Restaurant, UpdateRestaurantRequest } from "@/types";
import apiClient from "./client";

/**
 * Obtiene la lista de restaurantes paginada
 * @param page Número de página
 * @param size Cantidad de resultados
 */
export const getRestaurants = async (
  page = 0,
  size = 10
): Promise<PageResponse<Restaurant>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<Restaurant>>>(
    `/restaurants?page=${page}&size=${size}`
  );
  return response.data.data;
};

/**
 * Obtiene el detalle de un restaurante por su ID
 */
export const getRestaurantById = async (id: string): Promise<Restaurant> => {
  const response = await apiClient.get<ApiResponse<Restaurant>>(`/restaurants/${id}`);
  return response.data.data;
};

/**
 * Actualiza los datos del restaurante autenticado (HU 1.4)
 */
export const updateMyRestaurant = async (
  request: UpdateRestaurantRequest
): Promise<Restaurant> => {
  const response = await apiClient.put<ApiResponse<Restaurant>>("/restaurants/me", request);
  return response.data.data;
};

/**
 * Obtiene el perfil del restaurante autenticado con su estado de aprobacion (HU 3.1)
 */
export const getMyRestaurant = async (): Promise<Restaurant> => {
  const response = await apiClient.get<ApiResponse<Restaurant>>("/restaurants/me");
  return response.data.data;
};
