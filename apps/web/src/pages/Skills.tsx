import React, { useState } from "react";
import { Package, Trash2, RefreshCw, Info, XCircle } from "lucide-react";
import { SearchInput } from "../components/ui/SearchInput";
import type { Scope, SkillRecord } from "@skilldock/shared";
import { useSkillsList, useSkillInstall, useSkillRemove, useSkillUpdate } from "../hooks/useSkills";
import { ScopeToggle } from "../components/ui/ScopeToggle";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ApiError } from "../lib/api";
import { useLocale } from "../contexts/LocaleContext";
import { SkillsInstall } from "../components/SkillsInstall";
import { SkillsDiscovery } from "../components/SkillsDiscovery";

export function Skills({ onTaskStart }: { onTaskStart: (tid: string, title: string) => void }) {
  const [scope, setScope] = useState<Scope>("project");
  const { data: skillsData, isLoading } = useSkillsList(scope);
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

  const filteredSkills = skillsData?.skills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.agents?.some(a => a.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  const mutationError = installMutation.error || removeMutation.error || updateMutation.error;

  const executeInstall = async (packageName: string) => {
    const res = await installMutation.mutateAsync({ packageName, scope });
    onTaskStart(res.taskId, `${t("skills.install")} ${packageName}`);
    setConfirmState(null);
  };

  const handleInstallRequest = (packageName: string) => {
    setConfirmState({
      isOpen: true,
      title: t("skills.installTitle"),
      message: [
        t("skills.installMessage", { package: packageName }),
        t("skills.installScope", { scope }),
        t("skills.installDescription"),
      ],
      confirmLabel: t("skills.install"),
      onConfirm: () => executeInstall(packageName),
    });
  };

  const handleUpdate = (skill: SkillRecord) => {
    setConfirmState({
      isOpen: true,
      title: t("skills.updateTitle"),
      message: [
        t("skills.updateMessage", { name: skill.name }),
        t("skills.installScope", { scope }),
      ],
      confirmLabel: t("skills.updateButton"),
      onConfirm: async () => {
        const res = await updateMutation.mutateAsync({
          names: [skill.name],
          scope,
        });
        onTaskStart(res.taskId, `Updating ${skill.name}`);
        setConfirmState(null);
      }
    });
  };

  const handleRemove = (skill: SkillRecord) => {
    setConfirmState({
      isOpen: true,
      title: t("skills.removeTitle"),
      isDangerous: true,
      message: [
        t("skills.removeMessage", { name: skill.name }),
        t("skills.installScope", { scope }),
        t("skills.removeWarning")
      ],
      confirmLabel: t("skills.removeButton"),
      onConfirm: async () => {
        const res = await removeMutation.mutateAsync({
          names: [skill.name],
          scope,
        });
        onTaskStart(res.taskId, `Removing ${skill.name}`);
        setConfirmState(null);
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {mutationError && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-3">
          <XCircle size={16} />
          <span>{mutationError instanceof ApiError ? mutationError.message : t("common.operationFailed")}</span>
        </div>
      )}

      <header className="flex items-center gap-6">
        <ScopeToggle label={t("common.scope")} value={scope} onChange={setScope} />
        <SearchInput
          placeholder={t("skills.searchPlaceholder")}
          value={search}
          onChange={setSearch}
          className="w-64"
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkillsInstall
          scope={scope}
          isPending={installMutation.isPending}
          onInstall={handleInstallRequest}
        />
        <SkillsDiscovery
          scope={scope}
          onRequestInstall={handleInstallRequest}
        />
      </div>

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
                <div className="flex gap-4 items-center p-4 bg-accent/5 rounded-xl border border-accent/20 text-accent-light text-xs max-w-sm">
                  <Info size={16} className="shrink-0" />
                  <p>{t("skills.trySearchOrSwitch")}</p>
                </div>
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
                    className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg text-text-muted transition-colors"
                    title={t("skills.updateButton")}
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button
                    onClick={() => handleRemove(skill)}
                    className="p-2 hover:bg-danger/10 hover:text-danger rounded-lg text-text-muted transition-colors"
                    title={t("skills.removeButton")}
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
    </div>
  );
}
