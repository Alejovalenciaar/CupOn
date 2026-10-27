import { ApiResponse, PageResponse, Restaurant, UpdateRestaurantRequest } from "@/types";
import apiClient from "./client";

/**
 * Obtiene la lista de restaurantes paginada con filtros opcionales de búsqueda y tipo de cocina
 * @param page Número de página
 * @param size Cantidad de resultados
 * @param search Búsqueda por nombre o descripción (HU14)
 * @param cuisineType Filtro por categoría / tipo de cocina (HU22)
 */
export const getRestaurants = async (
  page = 0,
  size = 10,
  search?: string,
  cuisineType?: string
): Promise<PageResponse<Restaurant>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  if (search && search.trim()) {
    params.append("search", search.trim());
  }
  if (cuisineType && cuisineType.trim()) {
    params.append("cuisineType", cuisineType.trim());
  }

  const response = await apiClient.get<ApiResponse<PageResponse<Restaurant>>>(
    `/restaurants?${params.toString()}`
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
