import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="bg-surface-700 text-text border border-border rounded-2xl shadow-2xl p-0 backdrop:bg-surface-900/80 backdrop:backdrop-blur-sm max-w-md w-full overflow-hidden"
      onClose={onCancel}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDangerous ? 'bg-danger/20 text-danger' : 'bg-accent/20 text-accent'}`}>
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2 mb-8">
          {message.map((line, i) => (
            <p key={i} className="text-sm text-text-muted">{line}</p>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-surface-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-opacity hover:opacity-90 ${isDangerous ? 'bg-danger' : 'bg-accent'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>,
    document.body
  );
}
