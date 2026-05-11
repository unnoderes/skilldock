import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, FolderPlus, Loader2, X } from "lucide-react";
import { ApiError } from "../lib/api";
import { useLocale } from "../contexts/LocaleContext";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function AddProjectDialog({
  isOpen,
  isPending,
  error,
  onAdd,
  onClose,
}: {
  isOpen: boolean;
  isPending: boolean;
  error: unknown;
  onAdd: (path: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [path, setPath] = useState("");
  const { t } = useLocale();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      return;
    }

    if (dialog.open) dialog.close();
    setPath("");
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="bg-surface-800 text-text border border-border rounded-xl shadow-2xl p-0 backdrop:bg-surface-900/80 backdrop:backdrop-blur-sm max-w-lg w-[calc(100vw-2rem)] overflow-hidden"
      onClose={onClose}
    >
      <form
        className="p-5 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmedPath = path.trim();
          if (trimmedPath.length > 0) onAdd(trimmedPath);
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-accent">
              <FolderPlus size={18} />
              <h3 className="font-bold">{t("projects.addLocalProject")}</h3>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {t("projects.addLocalProjectHint")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-700"
            aria-label={t("dialog.cancel")}
          >
            <X size={18} />
          </button>
        </div>

        <label className="block space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-text-muted">
            {t("projects.projectPath")}
          </span>
          <input
            autoFocus
            value={path}
            onChange={(event) => setPath(event.target.value)}
            placeholder="/home/user/my-project"
            disabled={isPending}
            className="font-mono text-sm"
          />
        </label>

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="break-words">
              {getErrorMessage(error, t("projects.addProjectFailed"))}
            </span>
          </div>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-surface-700 transition-colors"
          >
            {t("dialog.cancel")}
          </button>
          <button
            type="submit"
            disabled={isPending || path.trim().length === 0}
            className="px-4 py-2 text-sm font-bold rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <FolderPlus size={16} />}
            {t("projects.validateAndAdd")}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}
