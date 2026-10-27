import apiClient from "./client";
import { ApiResponse, FileUploadResponse } from "@/types";

export type UploadFolder = "promotions" | "logos";

/**
 * Sube una imagen (logo o promocion) a Cloudinary a traves del backend.
 * REquiere que el usuario tenga el rol ROLE_RESTAURANTE (el JWT lo adjunta apiCLient automaticamente).
 * Si hay error (archivo demasiado grande, formato invalido, problema con Cloudinary, etc.) lanza una excepcion 
 * con status 400, 413 o 500.
 * 
 * @param file Archivo File a subir (jpg, png, webp, max 5MB). El frontend debe validar tipo y tamaño antes de llamar.
 * @param folder Carpeta en Cloudinary: "logos" o "promotions"
 * @returns Promesa de FileUploadResponse con url, publicId, format, size, width, height
 */

export const uploadFile = async (file: File, folder: UploadFolder = "promotions")
    : Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await apiClient.post<ApiResponse<FileUploadResponse>>("/files/upload", formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );
    return response.data.data;
};