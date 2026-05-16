import React from "react";
import { AlertTriangle, RefreshCw, Search, Trash2 } from "lucide-react";
import type { ProjectRecord, Scope } from "@skilldock/shared";
import { ScopeToggle } from "./ui/ScopeToggle";
import { SkillsInstall } from "./SkillsInstall";
import { useLocale } from "../contexts/LocaleContext";

export function SkillsActionPanel({
  scope,
  onScopeChange,
  activeProject,
  projectWriteDisabled,
  selectedCount,
  filteredCount,
  onBulkUpdateRequest,
  onBulkRemoveRequest,
  onInstallRequest,
  onDiscoverOpen,
  isPending,
  isBulkUpdatePending,
  isBulkRemovePending,
}: {
  scope: Scope;
  onScopeChange: (scope: Scope) => void;
  activeProject: ProjectRecord | null;
  projectWriteDisabled: boolean;
  selectedCount: number;
  filteredCount: number;
  onBulkUpdateRequest: () => void;
  onBulkRemoveRequest: () => void;
  onInstallRequest: (packageName: string) => void;
  onDiscoverOpen: () => void;
  isPending: boolean;
  isBulkUpdatePending: boolean;
  isBulkRemovePending: boolean;
}) {
  const { t } = useLocale();
  const bulkActionsDisabled = selectedCount === 0 || projectWriteDisabled;
  const bulkActionsTitle = projectWriteDisabled ? t("projects.invalidWriteDisabled") : undefined;

  return (
    <div className="space-y-5 p-5">
      <div>
        <h3 className="mb-1 text-sm font-bold">{t("skills.addSkill")}</h3>
        <p className="text-xs text-text-muted">
          {activeProject?.name ?? t("projects.loading")}
        </p>
        {activeProject?.path && (
          <p className="break-all text-xs text-text-muted">{activeProject.path}</p>
        )}
        {projectWriteDisabled && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/10 p-2 text-xs text-danger">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{t("projects.invalidWriteDisabled")}</span>
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {t("common.scope")}
        </label>
        <ScopeToggle label={t("common.scope")} value={scope} onChange={onScopeChange} />
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {t("skills.bulkActions")}
        </label>
        <div className="space-y-3 rounded-xl border border-border bg-surface-900/50 p-3">
          <p className="text-xs text-text-muted">
            {t("skills.selectionCountWithTotal", {
              count: String(selectedCount),
              total: String(filteredCount),
            })}
          </p>

          <button
            type="button"
            onClick={onBulkUpdateRequest}
            disabled={bulkActionsDisabled || isBulkUpdatePending}
            title={bulkActionsTitle}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-text"
          >
            <RefreshCw size={14} className={isBulkUpdatePending ? "animate-spin" : ""} />
            {t("skills.updateSelectedButton")}
          </button>

          <button
            type="button"
            onClick={onBulkRemoveRequest}
            disabled={bulkActionsDisabled || isBulkRemovePending}
            title={bulkActionsTitle}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-text"
          >
            <Trash2 size={14} />
            {t("skills.removeSelectedButton")}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {t("skills.installFromPackage")}
        </label>
        <SkillsInstall
          scope={scope}
          isPending={isPending}
          onInstall={onInstallRequest}
          variant="plain"
        />
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {t("skills.discoverSkills")}
        </label>
        <button
          onClick={onDiscoverOpen}
          disabled={projectWriteDisabled}
          title={projectWriteDisabled ? t("projects.invalidWriteDisabled") : undefined}
          className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-surface-600 disabled:opacity-50"
        >
          <Search size={14} />
          {t("skills.discoverSkills")}
        </button>
      </div>
    </div>
  );
}
