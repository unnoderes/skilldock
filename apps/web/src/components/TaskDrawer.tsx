import React from "react";
import { Terminal, ChevronDown, ChevronUp, Clock, Hash, CheckCircle2, XCircle } from "lucide-react";
import type { TaskRecord, TaskOutputChunk } from "@skilldock/shared";
import { StatusBadge } from "./ui/StatusBadge";
import { ResultPanel } from "./ui/ResultPanel";
import { useLocale } from "../contexts/LocaleContext";

export function TaskDrawer({
  activeTask,
  onClose,
  isOpen,
  setIsOpen
}: {
  activeTask: { title: string; task: TaskRecord; transport: string } | null;
  onClose: () => void;
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
}) {
  const { t } = useLocale();
  if (!activeTask) return null;

  const { task, title, transport } = activeTask;
  const isFinished = task.status === "succeeded" || task.status === "failed";

  const output = task.output.length > 0
    ? task.output
    : [{ timestamp: task.createdAt, stream: "system", text: t("taskDrawer.initializing") } satisfies TaskOutputChunk];

  return (
    <div className={`fixed bottom-0 right-0 left-64 bg-surface-700 border-t border-border shadow-2xl transition-all z-40 ${
      isOpen ? "h-[60vh]" : "h-12"
    }`}>
      {/* Header Bar */}
      <div
        className="h-12 px-6 flex items-center justify-between cursor-pointer border-b border-border bg-surface-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <Terminal size={16} className={isFinished ? "text-text-muted" : "text-accent animate-pulse"} />
          <span className="text-sm font-semibold tracking-tight">{title}</span>
          <StatusBadge status={task.status} />
          <span className="text-[10px] text-text-muted font-mono bg-surface-900 px-2 py-0.5 rounded border border-border">
            {task.id.slice(0, 8)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1.5 hover:bg-surface-600 rounded-md text-text-muted transition-colors"
          >
            <XCircle size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="h-[calc(60vh-48px)] flex flex-col md:flex-row">
          {/* Metadata Sidebar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border p-6 space-y-6 overflow-y-auto shrink-0 bg-surface-800/50">
            <section className="space-y-2">
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted">{t("taskDrawer.lifecycle")}</h4>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">{t("taskDrawer.created")}</span>
                  <span>{new Date(task.createdAt).toLocaleTimeString()}</span>
                </div>
                {task.startedAt && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t("taskDrawer.started")}</span>
                    <span>{new Date(task.startedAt).toLocaleTimeString()}</span>
                  </div>
                )}
                {task.finishedAt && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t("taskDrawer.finished")}</span>
                    <span>{new Date(task.finishedAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </section>

            {task.project && (
              <section className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted">{t("taskDrawer.project")}</h4>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t("taskDrawer.projectName")}</span>
                    <span className="truncate max-w-[140px]" title={task.project.projectName}>{task.project.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">{t("taskDrawer.projectPath")}</span>
                    <span className="break-all text-right max-w-[140px]" title={task.project.projectPath}>{task.project.projectPath}</span>
                  </div>
                  {task.scope && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">{t("taskDrawer.scope")}</span>
                      <span className="bg-surface-900 px-2 rounded border border-border">{task.scope}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="space-y-2">
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted">{t("taskDrawer.network")}</h4>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-text-muted">{t("taskDrawer.transport")}</span>
                <span className="bg-surface-900 px-2 rounded border border-border">{transport}</span>
              </div>
            </section>

            {isFinished && (
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                task.status === "succeeded" ? "bg-success/10 border-success/20 text-success" : "bg-danger/10 border-danger/20 text-danger"
              }`}>
                {task.status === "succeeded" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span className="text-xs font-bold uppercase tracking-tight">
                  Task {task.status}
                </span>
              </div>
            )}
          </div>

          {/* Terminal Output */}
          <div className="flex-1 flex flex-col bg-surface-900 overflow-hidden font-mono text-[12px]">
            <div className="flex-1 overflow-y-auto p-6 space-y-1">
              {output.map((chunk, i) => (
                <div key={i} className="flex gap-4 group hover:bg-surface-800/30 px-2 rounded -mx-2 py-0.5">
                  <span className="text-[10px] text-text-muted shrink-0 w-20">
                    [{new Date(chunk.timestamp).toLocaleTimeString()}]
                  </span>
                  <span className={`shrink-0 w-12 text-[10px] uppercase font-bold ${
                    chunk.stream === "stderr" ? "text-danger" :
                    chunk.stream === "system" ? "text-accent-light" : "text-text-muted"
                  }`}>
                    {chunk.stream}
                  </span>
                  <span className="whitespace-pre-wrap break-all">{chunk.text}</span>
                </div>
              ))}
            </div>

            {task.result && (
              <div className="p-6 border-t border-border bg-surface-800/80">
                <ResultPanel title={t("taskDrawer.finalResult")} result={task.result} compact />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
