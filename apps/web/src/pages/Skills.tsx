import React, { useState } from "react";
import { Package, Trash2, RefreshCw, XCircle } from "lucide-react";
import { SearchInput } from "../components/ui/SearchInput";
import type { ProjectRecord, Scope, SkillRecord } from "@skilldock/shared";
import { useSkillsList, useSkillInstall, useSkillRemove, useSkillUpdate } from "../hooks/useSkills";
import { useProjects } from "../hooks/useProjects";
import { ScopeToggle } from "../components/ui/ScopeToggle";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ApiError } from "../lib/api";
import { useLocale } from "../contexts/LocaleContext";
import { SkillsActionPanel } from "../components/SkillsActionPanel";
import { SkillDiscoveryDialog } from "../components/SkillDiscoveryDialog";

export function Skills({ onTaskStart }: { onTaskStart: (tid: string, title: string) => void }) {
  const [scope, setScope] = useState<Scope>("project");
  const { activeProject, activeProjectId } = useProjects();
  const { data: skillsData, isLoading } = useSkillsList(scope, activeProjectId);
  const [search, setSearch] = useState("");
  const { t } = useLocale();

  const installMutation = useSkillInstall();
  const removeMutation = useSkillRemove();
  const updateMutation = useSkillUpdate();

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string[];
    onConfirm: () => void;
    isDangerous?: boolean;
    confirmLabel?: string;
  } | null>(null);

  const [discoverDialogOpen, setDiscoverDialogOpen] = useState(false);

  const filteredSkills = skillsData?.skills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.agents?.some(a => a.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  const mutationError = installMutation.error || removeMutation.error || updateMutation.error;
  const projectWriteDisabled = scope === "project" && activeProject?.status !== "valid";

  const projectContextMessage = (project: ProjectRecord | null) => {
    if (!project) return t("projects.loading");
    return t("projects.contextLine", {
      name: project.name,
      path: project.path,
    });
  };

  const executeInstall = async (packageName: string) => {
    const res = await installMutation.mutateAsync({
      packageName,
      scope,
      projectId: activeProjectId ?? undefined,
    });
    onTaskStart(res.taskId, `${t("skills.install")} ${packageName}`);
    setConfirmState(null);
  };

  const handleInstallRequest = (packageName: string) => {
    if (projectWriteDisabled) return;

    setConfirmState({
      isOpen: true,
      title: t("skills.installTitle"),
      message: [
        t("skills.installMessage", { package: packageName }),
        projectContextMessage(activeProject),
        t("skills.installScope", { scope }),
        t("skills.installDescription"),
      ],
      confirmLabel: t("skills.install"),
      onConfirm: () => executeInstall(packageName),
    });
  };

  const handleUpdate = (skill: SkillRecord) => {
    if (projectWriteDisabled) return;

    setConfirmState({
      isOpen: true,
      title: t("skills.updateTitle"),
      message: [
        t("skills.updateMessage", { name: skill.name }),
        projectContextMessage(activeProject),
        t("skills.installScope", { scope }),
      ],
      confirmLabel: t("skills.updateButton"),
      onConfirm: async () => {
        const res = await updateMutation.mutateAsync({
          names: [skill.name],
          scope,
          projectId: activeProjectId ?? undefined,
        });
        onTaskStart(res.taskId, `Updating ${skill.name}`);
        setConfirmState(null);
      }
    });
  };

  const handleRemove = (skill: SkillRecord) => {
    if (projectWriteDisabled) return;

    setConfirmState({
      isOpen: true,
      title: t("skills.removeTitle"),
      isDangerous: true,
      message: [
        t("skills.removeMessage", { name: skill.name }),
        projectContextMessage(activeProject),
        t("skills.installScope", { scope }),
        t("skills.removeWarning")
      ],
      confirmLabel: t("skills.removeButton"),
      onConfirm: async () => {
        const res = await removeMutation.mutateAsync({
          names: [skill.name],
          scope,
          projectId: activeProjectId ?? undefined,
        });
        onTaskStart(res.taskId, `Removing ${skill.name}`);
        setConfirmState(null);
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
      <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-y-auto">
        {mutationError && (
          <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-3">
            <XCircle size={16} />
            <span>{mutationError instanceof ApiError ? mutationError.message : t("common.operationFailed")}</span>
          </div>
        )}

        <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <ScopeToggle label={t("common.scope")} value={scope} onChange={setScope} />
          <SearchInput
            placeholder={t("skills.searchPlaceholder")}
            value={search}
            onChange={setSearch}
            className="sm:w-64"
          />
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-surface-800 border border-border animate-pulse" />
            ))
          ) : filteredSkills.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title={t("skills.noSkillsFound")}
                message={search ? t("skills.noSearchMatch", { search, scope }) : t("skills.noSkillsInstalled", { scope })}
                action={!search && (
                  <button
                    onClick={() => setDiscoverDialogOpen(true)}
                    disabled={projectWriteDisabled}
                    title={projectWriteDisabled ? t("projects.invalidWriteDisabled") : undefined}
                    className="px-4 py-2 border border-border rounded-lg text-xs font-bold hover:bg-surface-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {t("skills.discoverSkills")}
                  </button>
                )}
              />
            </div>
          ) : (
            filteredSkills.map((skill) => (
              <article key={skill.name} className="group p-6 rounded-2xl bg-surface-800 border border-border hover:border-accent/50 transition-all flex flex-col gap-4 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-xl bg-surface-900 border border-border group-hover:border-accent/30 transition-colors">
                    <Package size={20} className="text-text-muted group-hover:text-accent transition-colors" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleUpdate(skill)}
                      disabled={projectWriteDisabled}
                      className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg text-text-muted transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                      title={projectWriteDisabled ? t("projects.invalidWriteDisabled") : t("skills.updateButton")}
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button
                      onClick={() => handleRemove(skill)}
                      disabled={projectWriteDisabled}
                      className="p-2 hover:bg-danger/10 hover:text-danger rounded-lg text-text-muted transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                      title={projectWriteDisabled ? t("projects.invalidWriteDisabled") : t("skills.removeButton")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold tracking-tight text-lg mb-1">{skill.name}</h4>
                  <p className="text-xs text-text-muted font-mono truncate">{skill.path || t("skills.installedInSystem")}</p>
                </div>

                <div className="mt-auto pt-4 flex flex-wrap gap-2">
                  {skill.agents?.map(agent => (
                    <span key={agent} className="px-2 py-0.5 rounded-md bg-surface-900 border border-border text-[10px] font-bold text-text-muted uppercase tracking-tight">
                      {agent}
                    </span>
                  )) || <span className="text-[10px] italic text-text-muted">{t("skills.noAgents")}</span>}
                </div>
              </article>
            ))
          )}
        </section>
      </div>

      <aside className="w-full lg:w-[360px] lg:h-[calc(100vh-7rem)] shrink-0 bg-surface-800 border border-border overflow-y-auto">
          <SkillsActionPanel
            scope={scope}
            onScopeChange={setScope}
            activeProject={activeProject}
            projectWriteDisabled={projectWriteDisabled}
            onInstallRequest={handleInstallRequest}
            onDiscoverOpen={() => setDiscoverDialogOpen(true)}
            isPending={installMutation.isPending}
          />
        </aside>

        {confirmState && (
          <ConfirmDialog
            isOpen={confirmState.isOpen}
            title={confirmState.title}
            message={confirmState.message}
            confirmLabel={confirmState.confirmLabel}
            onConfirm={confirmState.onConfirm}
            onCancel={() => setConfirmState(null)}
            isDangerous={confirmState.isDangerous}
          />
        )}

        {discoverDialogOpen && (
          <SkillDiscoveryDialog
            scope={scope}
            onRequestInstall={handleInstallRequest}
            onClose={() => setDiscoverDialogOpen(false)}
          />
        )}
      </div>
  );
}
