import { ApiResponse, PageResponse, Promotion, CreatePromotionRequest, RedemptionResponse, Category, PromotionStats } from "@/types";
import apiClient from "./client";

/**
 * Obtiene la lista de promociones activas paginada
 * @param search Término de búsqueda opcional
 * @param page Número de página (inicia en 0)
 * @param size Cantidad de promociones por página
 * @param dayOfWeek Día opcional en que aplica la promoción (MONDAY … SUNDAY)
 * @param categoryId ID opcional de la categoría
 * @param sort "popular" ordena por canjes + favoritos + vistas
 */
export const getPromotions = async (
  search?: string,
  page = 0,
  size = 10,
  dayOfWeek?: string,
  categoryId?: string,
  sort?: "popular"
): Promise<PageResponse<Promotion>> => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (dayOfWeek) params.append("dayOfWeek", dayOfWeek);
  if (categoryId) params.append("categoryId", categoryId);
  if (sort) params.append("sort", sort);
  params.append("page", page.toString());
  params.append("size", size.toString());

  const response = await apiClient.get<ApiResponse<PageResponse<Promotion>>>(
    `/promotions?${params.toString()}`
  );
  return response.data.data;
};

/**
 * Obtiene las categorías de promociones (HU 21) — público
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<ApiResponse<Category[]>>("/categories");
  return response.data.data;
};

/**
 * Obtiene el detalle de una promoción por su ID
 */
export const getPromotionById = async (id: string): Promise<Promotion> => {
  const response = await apiClient.get<ApiResponse<Promotion>>(`/promotions/${id}`);
  return response.data.data;
};

const VIEWED_PROMOTIONS_KEY = "cupon_viewed_promotions";

const readViewedPromotions = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(VIEWED_PROMOTIONS_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeViewedPromotions = (ids: string[]) => {
  try {
    sessionStorage.setItem(VIEWED_PROMOTIONS_KEY, JSON.stringify(ids));
  } catch {
    // sessionStorage no disponible (modo privado, bloqueado): se omite el filtro
  }
};

/**
 * Registra una vista del detalle (HU 28) consultando GET /promotions/{id}.
 * Solo cuenta una vista por promoción y sesión del navegador. Se marca antes de la
 * petición para que el doble montaje de StrictMode no la cuente dos veces.
 */
export const registerPromotionView = async (id: string): Promise<void> => {
  const viewed = readViewedPromotions();
  if (viewed.includes(id)) return;
  writeViewedPromotions([...viewed, id]);
  try {
    await getPromotionById(id);
  } catch {
    // Si falla, se desmarca para reintentar en la próxima apertura
    writeViewedPromotions(readViewedPromotions().filter((v) => v !== id));
  }
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
 * Obtiene el resumen de promociones del restaurante autenticado (HU 26):
 * activas, pausadas, expiradas y vistas totales
 */
export const getMyPromotionStats = async (): Promise<PromotionStats> => {
  const response = await apiClient.get<ApiResponse<PromotionStats>>("/promotions/mine/stats");
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
