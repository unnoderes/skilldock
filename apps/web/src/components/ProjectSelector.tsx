import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Folder,
  FolderPlus,
  Loader2,
  Trash2,
} from "lucide-react";
import type { ProjectRecord, ProjectStatus } from "@skilldock/shared";
import { useLocale } from "../contexts/LocaleContext";
import { useProjects } from "../hooks/useProjects";
import { AddProjectDialog } from "./AddProjectDialog";

function statusClass(status: ProjectStatus) {
  if (status === "valid") return "border-success/30 bg-success/10 text-success";
  if (status === "missing") return "border-warning/30 bg-warning/10 text-warning";
  return "border-danger/30 bg-danger/10 text-danger";
}

function formatLastUsed(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useLocale();
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClass(status)}`}>
      {t(`projects.status.${status}`)}
    </span>
  );
}

function ProjectPath({ path }: { path: string }) {
  return (
    <span className="block min-w-0 truncate font-mono text-[11px] leading-5 text-text-muted" title={path}>
      {path}
    </span>
  );
}

function ProjectRow({
  project,
  isActive,
  canRemove,
  isMutating,
  onSelect,
  onRemove,
}: {
  project: ProjectRecord;
  isActive: boolean;
  canRemove: boolean;
  isMutating: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { t } = useLocale();
  const isValid = project.status === "valid";

  return (
    <div className="group flex items-start gap-2 rounded-lg border border-border/60 bg-surface-900/40 p-2">
      <button
        type="button"
        onClick={onSelect}
        disabled={!isValid || isActive || isMutating}
        className="min-w-0 flex-1 text-left rounded-md px-1 py-0.5 hover:bg-surface-700 disabled:hover:bg-transparent"
        title={!isValid ? t("projects.invalidCannotSelect") : project.path}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Folder size={15} className="shrink-0 text-accent" />
          <span className="min-w-0 truncate text-sm font-semibold">{project.name}</span>
          {isActive ? <Check size={14} className="shrink-0 text-success" /> : null}
        </div>
        <ProjectPath path={project.path} />
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <ProjectStatusBadge status={project.status} />
          {project.isLaunchProject ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {t("projects.launchProject")}
            </span>
          ) : null}
          <span className="text-[10px] text-text-muted">
            {t("projects.lastUsed", { time: formatLastUsed(project.lastUsedAt) || "-" })}
          </span>
        </div>
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove || isMutating}
        className="rounded-md p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger disabled:hover:bg-transparent disabled:hover:text-text-muted"
        title={canRemove ? t("projects.removeRecent") : t("projects.launchCannotRemove")}
        aria-label={t("projects.removeRecent")}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function ProjectSelector() {
  const {
    query,
    projects,
    activeProject,
    activeProjectId,
    addProject,
    setActiveProject,
    removeProject,
  } = useProjects();
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const recentProjects = useMemo(
    () => projects.filter((project) => project.id !== activeProjectId),
    [activeProjectId, projects],
  );

  const isMutating =
    addProject.isPending || setActiveProject.isPending || removeProject.isPending;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="w-full rounded-xl border border-border bg-surface-900/60 p-3 text-left hover:border-accent/60 hover:bg-surface-700/50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
            {t("projects.project")}
          </span>
          {query.isLoading ? <Loader2 size={13} className="animate-spin text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-2">
          <Folder size={16} className="shrink-0 text-accent" />
          <span className="min-w-0 truncate text-sm font-bold">
            {activeProject?.name ?? t("projects.loading")}
          </span>
        </div>
        {activeProject ? <ProjectPath path={activeProject.path} /> : null}
        {activeProject && activeProject.status !== "valid" ? (
          <div className="mt-2">
            <ProjectStatusBadge status={activeProject.status} />
          </div>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 max-h-[min(70vh,34rem)] overflow-y-auto rounded-xl border border-border bg-surface-800 p-3 shadow-2xl">
          {query.isError ? (
            <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{t("projects.loadFailed")}</span>
            </div>
          ) : null}

          {activeProject ? (
            <section className="space-y-2">
              <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
                {t("projects.currentProject")}
              </p>
              <ProjectRow
                project={activeProject}
                isActive
                canRemove={false}
                isMutating={isMutating}
                onSelect={() => undefined}
                onRemove={() => undefined}
              />
            </section>
          ) : null}

          <section className="mt-4 space-y-2">
            <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
              {t("projects.recentProjects")}
            </p>
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  isActive={false}
                  canRemove={!project.isLaunchProject}
                  isMutating={isMutating}
                  onSelect={() => {
                    setActiveProject.mutate(project.id, {
                      onSuccess: () => setIsOpen(false),
                    });
                  }}
                  onRemove={() => removeProject.mutate(project.id)}
                />
              ))
            ) : (
              <p className="rounded-lg border border-border/60 bg-surface-900/40 p-3 text-xs text-text-muted">
                {t("projects.noRecentProjects")}
              </p>
            )}
          </section>

          <div className="mt-4 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              <FolderPlus size={16} />
              {t("projects.addLocalProject")}
            </button>
          </div>
        </div>
      ) : null}

      <AddProjectDialog
        isOpen={isAddOpen}
        isPending={addProject.isPending}
        error={addProject.error}
        onClose={() => {
          setIsAddOpen(false);
          addProject.reset();
        }}
        onAdd={(path) => {
          addProject.mutate(
            { path, makeActive: true },
            {
              onSuccess: () => {
                setIsAddOpen(false);
                setIsOpen(false);
                addProject.reset();
              },
            },
          );
        }}
      />
    </div>
  );
}
