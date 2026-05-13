import React, { useEffect } from "react";
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
  const { t } = useLocale();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface-800 text-text shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={t("mcp.agentsDialogTitle")}
        onClick={(event) => event.stopPropagation()}
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
      </div>
    </div>,
    document.body,
  );
}