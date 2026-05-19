import React, { useEffect, useState } from "react";
import { Check, Package, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
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
import { SkillsInstall } from "../components/SkillsInstall";
import type { DiscoveryInstallRequest } from "../lib/skillsDiscovery";

const SKILL_SUMMARY_LIMIT = 3;
const SKILLS_GRID_COLUMNS_KEY = "skilldock.skillsGridColumns";
const SKILLS_GRID_COLUMN_OPTIONS = [3, 4, 5] as const;
const DEFAULT_SKILLS_GRID_COLUMNS = SKILLS_GRID_COLUMN_OPTIONS[0];

type SkillsGridColumnCount = (typeof SKILLS_GRID_COLUMN_OPTIONS)[number];

function normalizeSkillsGridColumns(value: number | null | undefined): SkillsGridColumnCount {
  return SKILLS_GRID_COLUMN_OPTIONS.includes(value as SkillsGridColumnCount)
    ? value as SkillsGridColumnCount
    : DEFAULT_SKILLS_GRID_COLUMNS;
}

function readSkillsGridColumnsPreference(): SkillsGridColumnCount {
  if (typeof window === "undefined") {
    return DEFAULT_SKILLS_GRID_COLUMNS;
  }

  const rawValue = window.localStorage.getItem(SKILLS_GRID_COLUMNS_KEY);
  return normalizeSkillsGridColumns(rawValue ? Number(rawValue) : undefined);
}

function persistSkillsGridColumnsPreference(value: SkillsGridColumnCount) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SKILLS_GRID_COLUMNS_KEY, String(normalizeSkillsGridColumns(value)));
}

export function Skills({ onTaskStart }: { onTaskStart: (tid: string, title: string) => void }) {
  const [scope, setScope] = useState<Scope>("project");
  const { activeProject, activeProjectId } = useProjects();
  const { data: skillsData, isLoading } = useSkillsList(scope, activeProjectId);
  const [search, setSearch] = useState("");
  const [selectedSkillNames, setSelectedSkillNames] = useState<string[]>([]);
  const [skillsGridColumns, setSkillsGridColumns] = useState<SkillsGridColumnCount>(() => readSkillsGridColumnsPreference());
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
  const desktopGridClass = skillsGridColumns === 5
    ? "xl:grid-cols-5"
    : skillsGridColumns === 4
      ? "xl:grid-cols-4"
      : "xl:grid-cols-3";

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

  const executeInstall = async ({
    packageName,
    skillNames,
    installMode,
  }: DiscoveryInstallRequest) => {
    const res = await installMutation.mutateAsync({
      packageName,
      skillNames,
      scope,
      projectId: activeProjectId ?? undefined,
    });
    onTaskStart(
      res.taskId,
      installMode === "selected-skills" && skillNames && skillNames.length > 0
        ? `${t("skills.install")} ${packageName} (${skillNames.join(", ")})`
        : `${t("skills.install")} ${packageName}`,
    );
    setConfirmState(null);
  };

  const handleInstallRequest = ({
    packageName,
    skillNames,
    installMode,
  }: DiscoveryInstallRequest) => {
    if (projectWriteDisabled) return;

    const selectedSkillCount = skillNames?.length ?? 0;
    const isSelectedSkillsInstall = installMode === "selected-skills" && selectedSkillCount > 0;
    const selectedSkillNames = skillNames ?? [];

    setConfirmState({
      isOpen: true,
      title: isSelectedSkillsInstall ? t("skills.installSelectedTitle") : t("skills.installTitle"),
      message: [
        t("skills.installMessage", { package: packageName }),
        projectContextMessage(activeProject),
        t("skills.installScope", { scope }),
        isSelectedSkillsInstall
          ? t("skills.installSelectedMessage", { count: String(selectedSkillCount) })
          : t("skills.installDescription"),
        ...(isSelectedSkillsInstall
          ? [
              t("skills.selectedNamesSummary", {
                names: summarizeSelectedSkills(selectedSkillNames),
              }),
            ]
          : []),
      ],
      confirmLabel: isSelectedSkillsInstall ? t("skills.discoveryInstallSelected") : t("skills.install"),
      onConfirm: () => executeInstall({ packageName, skillNames, installMode }),
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

  const toggleSkillSelection = (skillName: string) => {
    handleSkillSelectionChange(skillName, !selectedSkillNameSet.has(skillName));
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

  const handleSkillsGridColumnsChange = (nextValue: SkillsGridColumnCount) => {
    const normalizedValue = normalizeSkillsGridColumns(nextValue);
    setSkillsGridColumns(normalizedValue);
    persistSkillsGridColumnsPreference(normalizedValue);
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

        <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <ScopeToggle label={t("common.scope")} value={scope} onChange={setScope} />
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
            <SearchInput
              placeholder={t("skills.searchPlaceholder")}
              value={search}
              onChange={setSearch}
              className="w-full sm:min-w-[14rem] sm:flex-1 sm:max-w-sm"
            />
            <div className="w-full sm:min-w-[19rem] sm:flex-1 sm:max-w-md">
              <SkillsInstall
                scope={scope}
                isPending={installMutation.isPending}
                onInstall={(packageName) =>
                  handleInstallRequest({
                    packageName,
                    installMode: "package",
                  })}
                variant="plain"
              />
            </div>
            <button
              type="button"
              onClick={() => setDiscoverDialogOpen(true)}
              disabled={projectWriteDisabled}
              title={projectWriteDisabled ? t("projects.invalidWriteDisabled") : undefined}
              className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-border bg-surface-800 px-4 py-2 text-xs font-bold transition-colors hover:bg-surface-600 disabled:opacity-50 sm:w-auto"
            >
              <Search size={14} />
              {t("skills.discoverSkills")}
            </button>
          </div>
        </header>

        <section className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${desktopGridClass}`}>
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
                  onClick={() => toggleSkillSelection(skill.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleSkillSelection(skill.name);
                    }
                  }}
                  aria-pressed={isSelected}
                  aria-label={t("skills.selectSkill", { name: skill.name })}
                  className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-6 transition-all ${
                    isSelected
                      ? "border-accent/60 bg-accent/5 shadow-lg shadow-accent/5 ring-1 ring-accent/20"
                      : "border-border bg-surface-800 hover:border-accent/50"
                  } cursor-pointer`}
                >
                  {isSelected ? (
                    <div className="pointer-events-none absolute left-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border border-accent/40 bg-accent text-white shadow-sm shadow-accent/20">
                      <Check size={13} strokeWidth={3} />
                    </div>
                  ) : null}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-xl border bg-surface-900 p-3 transition-colors ${
                        isSelected ? "border-accent/30" : "border-border group-hover:border-accent/30"
                      }`}>
                        <Package size={20} className="text-text-muted transition-colors group-hover:text-accent" />
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleUpdate(skill);
                        }}
                        disabled={projectWriteDisabled}
                        className="rounded-lg p-2 text-text-muted transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                        title={projectWriteDisabled ? t("projects.invalidWriteDisabled") : t("skills.updateButton")}
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemove(skill);
                        }}
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
          allFilteredSelected={allFilteredSelected}
          onSelectAllFiltered={handleSelectAllFiltered}
          onClearSelection={handleClearSelection}
          onBulkUpdateRequest={handleBulkUpdateRequest}
          onBulkRemoveRequest={handleBulkRemoveRequest}
          skillsGridColumns={skillsGridColumns}
          skillsGridColumnOptions={SKILLS_GRID_COLUMN_OPTIONS}
          onSkillsGridColumnsChange={handleSkillsGridColumnsChange}
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
