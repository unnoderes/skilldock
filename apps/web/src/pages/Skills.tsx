import React, { useEffect, useState } from "react";
import { Package, RefreshCw, Trash2, XCircle } from "lucide-react";
import type { ProjectRecord, Scope, SkillRecord } from "@skilldock/shared";
import { SearchInput } from "../components/ui/SearchInput";
import {
  useSkillInstall,
  useSkillRemove,
  useSkillsList,
  useSkillUpdate,
} from "../hooks/useSkills";
import { useProjects } from "../hooks/useProjects";
import { ScopeToggle } from "../components/ui/ScopeToggle";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ApiError } from "../lib/api";
import { useLocale } from "../contexts/LocaleContext";
import { SkillsActionPanel } from "../components/SkillsActionPanel";
import { SkillDiscoveryDialog } from "../components/SkillDiscoveryDialog";

const SKILL_SUMMARY_LIMIT = 3;

export function Skills({ onTaskStart }: { onTaskStart: (tid: string, title: string) => void }) {
  const [scope, setScope] = useState<Scope>("project");
  const { activeProject, activeProjectId } = useProjects();
  const { data: skillsData, isLoading } = useSkillsList(scope, activeProjectId);
  const [search, setSearch] = useState("");
  const [selectedSkillNames, setSelectedSkillNames] = useState<string[]>([]);
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

  const skills: SkillRecord[] = skillsData?.skills ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredSkills: SkillRecord[] = skills.filter((skill: SkillRecord) => {
    return skill.name.toLowerCase().includes(normalizedSearch) ||
      skill.agents?.some((agent: string) => agent.toLowerCase().includes(normalizedSearch));
  });
  const filteredSkillNames = filteredSkills.map((skill: SkillRecord) => skill.name);
  const filteredSkillNamesKey = filteredSkillNames.join("\u001f");
  const filteredSkillNameSet = new Set(filteredSkillNames);
  const selectedSkillNameSet = new Set(selectedSkillNames);
  const allFilteredSelected = filteredSkills.length > 0 &&
    filteredSkills.every((skill: SkillRecord) => selectedSkillNameSet.has(skill.name));

  const mutationError = installMutation.error || removeMutation.error || updateMutation.error;
  const projectWriteDisabled = scope === "project" && activeProject?.status !== "valid";

  useEffect(() => {
    setSelectedSkillNames([]);
  }, [scope, activeProjectId]);

  useEffect(() => {
    setSelectedSkillNames((currentSelection) => {
      const nextSelection = currentSelection.filter((name) => filteredSkillNameSet.has(name));
      return nextSelection.length === currentSelection.length ? currentSelection : nextSelection;
    });
  }, [filteredSkillNamesKey]);

  const projectContextMessage = (project: ProjectRecord | null) => {
    if (!project) return t("projects.loading");
    return t("projects.contextLine", {
      name: project.name,
      path: project.path,
    });
  };

  const summarizeSelectedSkills = (names: string[]) => {
    const visibleNames = names.slice(0, SKILL_SUMMARY_LIMIT);
    const remainingCount = names.length - visibleNames.length;
    if (remainingCount <= 0) {
      return visibleNames.join(", ");
    }
    return `${visibleNames.join(", ")}, ${t("skills.selectedNamesMore", {
      count: String(remainingCount),
    })}`;
  };

  const buildSelectedNamesSnapshot = () => {
    return filteredSkills
      .filter((skill: SkillRecord) => selectedSkillNameSet.has(skill.name))
      .map((skill: SkillRecord) => skill.name);
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
      },
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
        t("skills.removeWarning"),
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
      },
    });
  };

  const handleSkillSelectionChange = (skillName: string, checked: boolean) => {
    setSelectedSkillNames((currentSelection) => {
      if (checked) {
        return currentSelection.includes(skillName)
          ? currentSelection
          : [...currentSelection, skillName];
      }
      return currentSelection.filter((name) => name !== skillName);
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedSkillNames(Array.from(new Set(filteredSkillNames)));
  };

  const handleClearSelection = () => {
    setSelectedSkillNames([]);
  };

  const handleBulkUpdateRequest = () => {
    const selectedNames = buildSelectedNamesSnapshot();
    if (selectedNames.length === 0 || projectWriteDisabled) return;

    setConfirmState({
      isOpen: true,
      title: t("skills.bulkUpdateTitle"),
      message: [
        t("skills.bulkUpdateMessage", { count: String(selectedNames.length) }),
        projectContextMessage(activeProject),
        t("skills.installScope", { scope }),
        t("skills.selectionCount", { count: String(selectedNames.length) }),
        t("skills.selectedNamesSummary", {
          names: summarizeSelectedSkills(selectedNames),
        }),
      ],
      confirmLabel: t("skills.updateSelectedButton"),
      onConfirm: async () => {
        const res = await updateMutation.mutateAsync({
          names: selectedNames,
          scope,
          projectId: activeProjectId ?? undefined,
        });
        onTaskStart(res.taskId, t("skills.updateSelectedButton"));
        setSelectedSkillNames([]);
        setConfirmState(null);
      },
    });
  };

  const handleBulkRemoveRequest = () => {
    const selectedNames = buildSelectedNamesSnapshot();
    if (selectedNames.length === 0 || projectWriteDisabled) return;

    setConfirmState({
      isOpen: true,
      title: t("skills.bulkRemoveTitle"),
      isDangerous: true,
      message: [
        t("skills.bulkRemoveMessage", { count: String(selectedNames.length) }),
        projectContextMessage(activeProject),
        t("skills.installScope", { scope }),
        t("skills.selectionCount", { count: String(selectedNames.length) }),
        t("skills.selectedNamesSummary", {
          names: summarizeSelectedSkills(selectedNames),
        }),
        t("skills.removeWarning"),
      ],
      confirmLabel: t("skills.removeSelectedButton"),
      onConfirm: async () => {
        const res = await removeMutation.mutateAsync({
          names: selectedNames,
          scope,
          projectId: activeProjectId ?? undefined,
        });
        onTaskStart(res.taskId, t("skills.removeSelectedButton"));
        setSelectedSkillNames([]);
        setConfirmState(null);
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 lg:h-[calc(100vh-13rem)] lg:min-h-[36rem] lg:flex-row lg:overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-6 lg:overflow-y-auto lg:pr-1">
        {mutationError && (
          <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
            <XCircle size={16} />
            <span>{mutationError instanceof ApiError ? mutationError.message : t("common.operationFailed")}</span>
          </div>
        )}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <ScopeToggle label={t("common.scope")} value={scope} onChange={setScope} />
          <SearchInput
            placeholder={t("skills.searchPlaceholder")}
            value={search}
            onChange={setSearch}
            className="sm:w-64"
          />
        </header>

        {!isLoading && filteredSkills.length > 0 && (
          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-800/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {t("skills.selectionTitle")}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {t("skills.selectionCountWithTotal", {
                  count: String(selectedSkillNames.length),
                  total: String(filteredSkills.length),
                })}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                disabled={allFilteredSelected}
                className="rounded-lg border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-surface-600 disabled:opacity-50"
              >
                {t("skills.selectAllFiltered")}
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                disabled={selectedSkillNames.length === 0}
                className="rounded-lg border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-surface-600 disabled:opacity-50"
              >
                {t("skills.clearSelection")}
              </button>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-2xl border border-border bg-surface-800" />
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
                    className="whitespace-nowrap rounded-lg border border-border px-4 py-2 text-xs font-bold transition-colors hover:bg-surface-600 disabled:opacity-50"
                  >
                    {t("skills.discoverSkills")}
                  </button>
                )}
              />
            </div>
          ) : (
            filteredSkills.map((skill: SkillRecord) => {
              const isSelected = selectedSkillNameSet.has(skill.name);

              return (
                <article
                  key={skill.name}
                  className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-6 transition-all ${
                    isSelected
                      ? "border-accent/60 bg-accent/5 ring-1 ring-accent/20"
                      : "border-border bg-surface-800 hover:border-accent/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) => handleSkillSelectionChange(skill.name, event.target.checked)}
                        aria-label={t("skills.selectSkill", { name: skill.name })}
                        title={t("skills.selectSkill", { name: skill.name })}
                        className="mt-1 h-4 w-4 cursor-pointer rounded border-border bg-surface-700 text-accent focus:ring-0 focus:ring-offset-0"
                      />
                      <div className="rounded-xl border border-border bg-surface-900 p-3 transition-colors group-hover:border-accent/30">
                        <Package size={20} className="text-text-muted transition-colors group-hover:text-accent" />
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleUpdate(skill)}
                        disabled={projectWriteDisabled}
                        className="rounded-lg p-2 text-text-muted transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                        title={projectWriteDisabled ? t("projects.invalidWriteDisabled") : t("skills.updateButton")}
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => handleRemove(skill)}
                        disabled={projectWriteDisabled}
                        className="rounded-lg p-2 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                        title={projectWriteDisabled ? t("projects.invalidWriteDisabled") : t("skills.removeButton")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-1 text-lg font-bold tracking-tight">{skill.name}</h4>
                    <p className="truncate font-mono text-xs text-text-muted">
                      {skill.path || t("skills.installedInSystem")}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    {skill.agents && skill.agents.length > 0 ? (
                      skill.agents.map((agent: string) => (
                        <span
                          key={agent}
                          className="rounded-md border border-border bg-surface-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-text-muted"
                        >
                          {agent}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] italic text-text-muted">{t("skills.noAgents")}</span>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      <aside className="w-full shrink-0 border border-border bg-surface-800 lg:w-[360px] lg:self-stretch lg:overflow-y-auto">
        <SkillsActionPanel
          scope={scope}
          onScopeChange={setScope}
          activeProject={activeProject}
          projectWriteDisabled={projectWriteDisabled}
          selectedCount={selectedSkillNames.length}
          filteredCount={filteredSkills.length}
          onBulkUpdateRequest={handleBulkUpdateRequest}
          onBulkRemoveRequest={handleBulkRemoveRequest}
          onInstallRequest={handleInstallRequest}
          onDiscoverOpen={() => setDiscoverDialogOpen(true)}
          isPending={installMutation.isPending}
          isBulkUpdatePending={updateMutation.isPending}
          isBulkRemovePending={removeMutation.isPending}
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
