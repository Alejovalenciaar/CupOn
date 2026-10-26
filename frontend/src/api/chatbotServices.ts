import { ApiResponse, ChatResponse } from "@/types";
import apiClient from "./client";

/**
 * Envía una pregunta al chatbot de CupOn — POST /chatbot/chat.
 * Es público: funciona sin sesión iniciada, y si hay un token válido
 * (lo agrega apiClient automáticamente) la consulta queda asociada al
 * usuario autenticado en el backend.
 */
export const sendChatMessage = async (pregunta: string): Promise<string> => {
  const response = await apiClient.post<ApiResponse<ChatResponse>>("/chatbot/chat", {
    pregunta,
  });
  return response.data.data.respuesta;
};
