import React from "react";
import { Download, Search, AlertTriangle } from "lucide-react";
import type { ProjectRecord, Scope } from "@skilldock/shared";
import { ScopeToggle } from "./ui/ScopeToggle";
import { SkillsInstall } from "./SkillsInstall";
import { useLocale } from "../contexts/LocaleContext";

export function SkillsActionPanel({
  scope,
  onScopeChange,
  activeProject,
  projectWriteDisabled,
  onInstallRequest,
  onDiscoverOpen,
  isPending,
}: {
  scope: Scope;
  onScopeChange: (scope: Scope) => void;
  activeProject: ProjectRecord | null;
  projectWriteDisabled: boolean;
  onInstallRequest: (packageName: string) => void;
  onDiscoverOpen: () => void;
  isPending: boolean;
}) {
  const { t } = useLocale();

  return (
    <div className="space-y-5 p-5">
      <div>
        <h3 className="text-sm font-bold mb-1">{t("skills.addSkill")}</h3>
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

      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 block">
          {t("common.scope")}
        </label>
        <ScopeToggle label={t("common.scope")} value={scope} onChange={onScopeChange} />
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 block">
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
        <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 block">
          {t("skills.discoverSkills")}
        </label>
        <button
          onClick={onDiscoverOpen}
          disabled={projectWriteDisabled}
          title={projectWriteDisabled ? t("projects.invalidWriteDisabled") : undefined}
          className="w-full px-3 py-2 border border-border rounded-lg text-xs font-bold hover:bg-surface-600 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Search size={14} />
          {t("skills.discoverSkills")}
        </button>
      </div>
    </div>
  );
}
