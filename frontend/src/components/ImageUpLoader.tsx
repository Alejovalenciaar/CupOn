import React, { useState, useRef } from "react";
import { uploadFile, UploadFolder } from "../api/fileService";

interface ImageUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    folder?: UploadFolder;
    label?: string;
    hint?: string;
    aspectRatio?: "square" | "video"; // "square" para logos (1:1), "video" para promos (16:9)
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

export const ImageUploader: React.FC<ImageUploaderProps> = ({
    value,
    onChange,
    folder = "promotions",
    label = "Imagen",
    hint = "Formatos permitidos: JPG, PNG, WEBP (máx. 5MB)",
    aspectRatio = "video",
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);

        // Validación de tipo
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError("Solo se permiten imágenes en formato JPG, PNG o WEBP.");
            return;
        }

        // Validación de tamaño (5 MB)
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setError(`La imagen excede el tamaño máximo permitido de ${MAX_SIZE_MB}MB.`);
            return;
        }

        try {
            setIsUploading(true);
            const res = await uploadFile(file, folder);
            onChange(res.url);
        } catch (err: any) {
            const serverMsg =
                err.response?.data?.message || "No se pudo subir la imagen. Intenta nuevamente.";
            setError(serverMsg);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = () => {
        onChange("");
        setError(null);
    };

    const previewClass =
        aspectRatio === "square"
            ? "w-24 h-24 rounded-full object-cover"
            : "w-full h-40 rounded-button object-cover";

    return (
        <div className="space-y-2">
            {label && <label className="block text-sm font-medium text-content-primary">{label}</label>}

            {/* Input de archivo oculto */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Si ya hay imagen seleccionada o subida */}
            {value ? (
                <div className="relative group border border-surface-border rounded-button overflow-hidden bg-surface-muted p-2">
                    <div className="flex items-center gap-4">
                        <img
                            src={value}
                            alt="Vista previa"
                            className={`${previewClass} border border-surface-border`}
                            onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-content-secondary truncate">{value}</p>
                            <div className="mt-2 flex gap-2">
                                <button
                                    type="button"
                                    disabled={isUploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs px-3 py-1.5 bg-surface-elevated hover:bg-surface-border border border-surface-border rounded text-content-primary transition"
                                >
                                    Cambiar
                                </button>
                                <button
                                    type="button"
                                    disabled={isUploading}
                                    onClick={handleRemove}
                                    className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded transition"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Zona para subir cuando no hay imagen */
                <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-surface-border hover:border-primary/50 bg-surface-muted/50 rounded-button p-6 text-center cursor-pointer transition ${isUploading ? "opacity-50 pointer-events-none" : ""
                        }`}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs text-content-secondary font-medium">Subiendo a Cloudinary...</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <div className="text-2xl mb-1">📷</div>
                            <p className="text-sm font-medium text-content-primary">
                                Haz clic para subir un archivo
                            </p>
                            <p className="text-xs text-content-secondary">{hint}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Alternador para ingresar URL manual si se desea */}
            <div className="flex justify-between items-center text-xs">
                <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-content-secondary hover:text-content-primary underline"
                >
                    {showUrlInput ? "Ocultar ingreso por URL" : "o pegar una URL directamente"}
                </button>
            </div>

            {showUrlInput && (
                <input
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-surface-border bg-surface-elevated text-content-primary"
                />
            )}

            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};
