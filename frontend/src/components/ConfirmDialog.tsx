import { useEffect, useState } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  inputLabel?: string;
  inputPlaceholder?: string;
  onConfirm: (inputValue?: string) => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  inputLabel,
  inputPlaceholder,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-card border border-surface-border rounded-card shadow-hover w-full max-w-md overflow-hidden"
      >
        <div className="p-6 space-y-3">
          <h3 className="text-base font-bold text-content-primary tracking-tight">{title}</h3>
          <p className="text-xs text-content-secondary leading-relaxed">{description}</p>

          {inputLabel && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-content-primary mb-1.5">
                {inputLabel}
              </label>
              <textarea
                rows={2}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full bg-white border border-surface-border rounded-button px-3 py-2 text-xs text-content-primary placeholder:text-content-muted outline-none focus:border-brand-500 resize-none"
              />
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-surface-canvas border-t border-surface-border flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-content-secondary hover:text-content-primary bg-white hover:bg-surface-muted border border-surface-border px-4 py-2 rounded-button transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(text.trim() || undefined)}
            className={`text-xs font-semibold text-white px-4 py-2 rounded-button transition-colors shadow-subtle ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
