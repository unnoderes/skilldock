import React, { useState } from "react";
import { Package, Plus, Trash2, RefreshCw, Info, Search, XCircle } from "lucide-react";
import type { Scope, SkillRecord } from "@skilldock/shared";
import { useSkillsList, useSkillInstall, useSkillRemove, useSkillUpdate } from "../hooks/useSkills";
import { ScopeToggle } from "../components/ui/ScopeToggle";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ApiError } from "../lib/api";

export function Skills({ onTaskStart }: { onTaskStart: (tid: string, title: string) => void }) {
  const [scope, setScope] = useState<Scope>("project");
  const { data: skillsData, isLoading } = useSkillsList(scope);
  const [search, setSearch] = useState("");

  const installMutation = useSkillInstall();
  const removeMutation = useSkillRemove();
  const updateMutation = useSkillUpdate();

  // Dialog states
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string[];
    onConfirm: () => void;
    isDangerous?: boolean;
  } | null>(null);

  // Form states
  const [installPackage, setInstallPackage] = useState("");

  const filteredSkills = skillsData?.skills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.agents?.some(a => a.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  const mutationError = installMutation.error || removeMutation.error || updateMutation.error;

  const handleInstall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!installPackage.trim()) return;

    setConfirmState({
      isOpen: true,
      title: "Install Skill",
      message: [
        `You are about to install package: ${installPackage}`,
        `Scope: ${scope}`,
        "This will download and configure the skill for the specified agents."
      ],
      onConfirm: async () => {
        const res = await installMutation.mutateAsync({
          packageName: installPackage,
          scope,
        });
        onTaskStart(res.taskId, `Installing ${installPackage}`);
        setInstallPackage("");
        setConfirmState(null);
      }
    });
  };

  const handleUpdate = (skill: SkillRecord) => {
    setConfirmState({
      isOpen: true,
      title: "Update Skill",
      message: [
        `You are about to update skill: ${skill.name}`,
        `Scope: ${scope}`,
      ],
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
      title: "Remove Skill",
      isDangerous: true,
      message: [
        `You are about to remove skill: ${skill.name}`,
        `Scope: ${scope}`,
        "This action cannot be undone."
      ],
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
          <span>{mutationError instanceof ApiError ? mutationError.message : "Operation failed. Please try again."}</span>
        </div>
      )}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <ScopeToggle label="Scope" value={scope} onChange={setScope} />
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              placeholder="Search skills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 py-1.5 text-xs w-64 bg-surface-800 border-border focus:ring-1 focus:ring-accent outline-none rounded-lg"
            />
          </div>
        </div>

        <form onSubmit={handleInstall} className="flex gap-2">
          <input
            type="text"
            placeholder="Package name (e.g. vercel-labs/skills)"
            value={installPackage}
            onChange={e => setInstallPackage(e.target.value)}
            className="text-xs py-1.5 w-64 bg-surface-800 border-border rounded-lg"
          />
          <button
            type="submit"
            disabled={!installPackage.trim() || installMutation.isPending}
            className="px-4 py-1.5 bg-accent text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={14} />
            Install
          </button>
        </form>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-surface-800 border border-border animate-pulse" />
          ))
        ) : filteredSkills.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="No Skills Found"
              message={search ? `No skills match your search "${search}" in ${scope} scope.` : `You haven't installed any skills in the ${scope} scope yet.`}
              action={!search && (
                <div className="flex gap-4 items-center p-4 bg-accent/5 rounded-xl border border-accent/20 text-accent-light text-xs max-w-sm">
                  <Info size={16} className="shrink-0" />
                  <p>Try searching for a package above or switch to Global scope.</p>
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
                    title="Update Skill"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button
                    onClick={() => handleRemove(skill)}
                    className="p-2 hover:bg-danger/10 hover:text-danger rounded-lg text-text-muted transition-colors"
                    title="Remove Skill"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bold tracking-tight text-lg mb-1">{skill.name}</h4>
                <p className="text-xs text-text-muted font-mono truncate">{skill.path || "Installed in system"}</p>
              </div>

              <div className="mt-auto pt-4 flex flex-wrap gap-2">
                {skill.agents?.map(agent => (
                  <span key={agent} className="px-2 py-0.5 rounded-md bg-surface-900 border border-border text-[10px] font-bold text-text-muted uppercase tracking-tight">
                    {agent}
                  </span>
                )) || <span className="text-[10px] italic text-text-muted">No agents associated</span>}
              </div>

              <div className="absolute top-0 right-0 p-4">
                {/* Could add a status indicator here if backend provided it per-skill */}
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
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
          isDangerous={confirmState.isDangerous}
        />
      )}
    </div>
  );
}
