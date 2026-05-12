import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import { useLocale } from "../../contexts/LocaleContext";

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isDangerous = false,
}: {
  isOpen: boolean;
  title: string;
  message: string[];
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}) {
  const { t } = useLocale();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/80 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface-700 text-text shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${isDangerous ? "bg-danger/20 text-danger" : "bg-accent/20 text-accent"}`}>
                <AlertTriangle size={20} />
              </div>
              <h3 id="confirm-dialog-title" className="text-lg font-bold">{title}</h3>
            </div>
            <button onClick={onCancel} className="text-text-muted transition-colors hover:text-text">
              <X size={20} />
            </button>
          </div>

          <div className="mb-8 space-y-2">
            {message.map((line, i) => (
              <p key={i} className="text-sm text-text-muted">{line}</p>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-600"
            >
              {t("dialog.cancel")}
            </button>
            <button
              onClick={onConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 ${isDangerous ? "bg-danger" : "bg-accent"}`}
            >
              {confirmLabel || t("dialog.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
