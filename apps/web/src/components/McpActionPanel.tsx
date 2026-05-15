import React from "react";
import { Plus, LayoutGrid, AlertTriangle } from "lucide-react";
import type { ProjectRecord } from "@skilldock/shared";
import { useLocale } from "../contexts/LocaleContext";

export function McpActionPanel({
  activeProject,
  projectWriteDisabled,
  onAddRequest,
  onViewAgents,
  target,
  name,
  onTargetChange,
  onNameChange,
  isPending,
}: {
  activeProject: ProjectRecord | null;
  projectWriteDisabled: boolean;
  onAddRequest: (e: React.FormEvent) => void;
  onViewAgents: () => void;
  target: string;
  name: string;
  onTargetChange: (value: string) => void;
  onNameChange: (value: string) => void;
  isPending: boolean;
}) {
  const { t } = useLocale();

  return (
    <div className="space-y-5 p-5">
      <div>
        <h3 className="text-sm font-bold mb-1">{t("mcp.addServerButton")}</h3>
        <p className="text-xs text-text-muted">
          {activeProject?.name ?? t("projects.loading")}
        </p>
        {activeProject?.path && (
          <p className="text-xs text-text-muted break-all">{activeProject.path}</p>
        )}
        {projectWriteDisabled && (
          <div className="mt-2 p-2 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>{t("projects.invalidWriteDisabled")}</span>
          </div>
        )}
      </div>

      <form onSubmit={onAddRequest} className="space-y-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
            {t("mcp.targetPlaceholder")}
          </label>
          <input
            type="text"
            placeholder={t("mcp.targetPlaceholder")}
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-surface-900 border border-border rounded-lg"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block">
            {t("mcp.namePlaceholder")}
          </label>
          <input
            type="text"
            placeholder={t("mcp.namePlaceholder")}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-surface-900 border border-border rounded-lg"
          />
        </div>
        <button
          type="submit"
          disabled={!target.trim() || isPending || projectWriteDisabled}
          title={projectWriteDisabled ? t("projects.invalidWriteDisabled") : undefined}
          className="w-full px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={14} />
          {t("mcp.addServerButton")}
        </button>
      </form>

      <div className="border-t border-border pt-4">
        <button
          onClick={onViewAgents}
          className="w-full px-3 py-2 border border-border rounded-lg text-xs font-bold hover:bg-surface-600 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-text-muted hover:text-text"
        >
          <LayoutGrid size={14} />
          {t("mcp.viewAgents")}
        </button>
      </div>
    </div>
  );
}
