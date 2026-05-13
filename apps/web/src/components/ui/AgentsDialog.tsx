import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, LayoutGrid } from "lucide-react";
import type { CommandResult } from "@skilldock/shared";
import { useLocale } from "../../contexts/LocaleContext";
import { McpAgentList } from "../McpAgentList";
import { EmptyState } from "./EmptyState";

export function AgentsDialog({
  isOpen,
  onClose,
  agentsData,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  agentsData: CommandResult | null | undefined;
  isLoading: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t } = useLocale();

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
      className="bg-surface-800 text-text border border-border rounded-2xl shadow-2xl p-0 backdrop:bg-surface-900/80 backdrop:backdrop-blur-sm max-w-2xl w-full overflow-hidden"
      onClose={onClose}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <LayoutGrid size={20} className="text-warning" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">
            {t("mcp.agentsDialogTitle")}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text transition-colors"
          aria-label={t("mcp.agentsDialogClose")}
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6 max-h-[70vh] overflow-y-auto">
        {isLoading ? (
          <div className="h-48 rounded-2xl bg-surface-900 border border-border animate-pulse" />
        ) : agentsData ? (
          <McpAgentList result={agentsData} />
        ) : (
          <EmptyState
            title={t("mcp.noAgentsFound")}
            message={t("mcp.couldNotRetrieve")}
          />
        )}
      </div>
    </dialog>,
    document.body,
  );
}