import React from "react";
import { Terminal, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { TaskRecord, TaskOutputChunk } from "@skilldock/shared";
import { StatusBadge } from "./ui/StatusBadge";
import { ResultPanel } from "./ui/ResultPanel";
import { useLocale } from "../contexts/LocaleContext";

const FINISHED_STATUSES = new Set<TaskRecord["status"]>(["succeeded", "failed"]);

function formatTime(value: string | undefined, locale: string): string {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(durationMs: number | undefined, locale: string): string {
  if (typeof durationMs !== "number" || Number.isNaN(durationMs)) return "-";

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  if (durationMs < 60_000) {
    return `${(durationMs / 1000).toLocaleString(locale, {
      minimumFractionDigits: durationMs % 1000 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    })}s`;
  }

  const minutes = Math.floor(durationMs / 60_000);
  const seconds = Math.floor((durationMs % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function compactText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 180) return normalized;
  return `${normalized.slice(0, 177).trimEnd()}...`;
}

function getSummaryTone(status: TaskRecord["status"]) {
  if (status === "succeeded") {
    return {
      containerClass: "task-summary--success",
      eyebrowClass: "text-success",
      icon: CheckCircle2,
      iconClass: "text-success",
    };
  }

  if (status === "failed") {
    return {
      containerClass: "task-summary--failed",
      eyebrowClass: "text-danger",
      icon: AlertTriangle,
      iconClass: "text-danger",
    };
  }

  return {
    containerClass: "task-summary--running",
    eyebrowClass: "text-accent-light",
    icon: Terminal,
    iconClass: "text-accent-light",
  };
}

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
  const { locale, t } = useLocale();
  const task = activeTask?.task ?? null;
  const title = activeTask?.title ?? t("taskDrawer.console");
  const transport = activeTask?.transport ?? "-";
  const isFinished = task ? FINISHED_STATUSES.has(task.status) : false;
  const result = task?.result;

  const output = task
    ? task.output.length > 0
      ? task.output
      : isFinished
        ? []
        : [{ timestamp: task.createdAt, stream: "system", text: t("taskDrawer.initializing") } satisfies TaskOutputChunk]
    : [];

  const summaryTone = task ? getSummaryTone(task.status) : getSummaryTone("queued");
  const SummaryIcon = summaryTone.icon;
  const duration = formatDuration(result?.durationMs, locale);
  const finishedLabel = task?.status === "failed"
    ? t("taskDrawer.failedSummary")
    : t("taskDrawer.succeededSummary");
  const summaryTitle = task?.status === "failed"
    ? compactText(task.error?.trim() || result?.stderr?.trim() || title)
    : title;

  return (
    <div className={`fixed bottom-0 right-0 left-64 bg-surface-700 border-t border-border shadow-2xl transition-all z-40 ${
      isOpen ? "h-[60vh]" : "h-12"
    }`}>
      <div
        className="h-12 px-6 flex items-center justify-between cursor-pointer border-b border-border bg-surface-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <Terminal size={16} className={isFinished ? "text-text-muted" : "text-accent animate-pulse"} />
          <span className="text-sm font-semibold tracking-tight">{title}</span>
          {task ? <StatusBadge status={task.status} /> : null}
          {task ? (
            <span className="text-[10px] text-text-muted font-mono bg-surface-900 px-2 py-0.5 rounded border border-border">
              {task.id.slice(0, 8)}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          {task ? (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1.5 hover:bg-surface-600 rounded-md text-text-muted transition-colors"
            >
              <XCircle size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {isOpen && (
        <div className="h-[calc(60vh-48px)] flex flex-col md:flex-row">
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border p-6 space-y-6 overflow-y-auto shrink-0 bg-surface-800/50">
            {task ? (
              <>
                <section className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted">{t("taskDrawer.lifecycle")}</h4>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between gap-4">
                      <span className="text-text-muted">{t("taskDrawer.created")}</span>
                      <span>{formatTime(task.createdAt, locale)}</span>
                    </div>
                    {task.startedAt && (
                      <div className="flex justify-between gap-4">
                        <span className="text-text-muted">{t("taskDrawer.started")}</span>
                        <span>{formatTime(task.startedAt, locale)}</span>
                      </div>
                    )}
                    {task.finishedAt && (
                      <div className="flex justify-between gap-4">
                        <span className="text-text-muted">{t("taskDrawer.finished")}</span>
                        <span>{formatTime(task.finishedAt, locale)}</span>
                      </div>
                    )}
                  </div>
                </section>

                {task.project && (
                  <section className="space-y-2">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted">{t("taskDrawer.project")}</h4>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between gap-4">
                        <span className="text-text-muted">{t("taskDrawer.projectName")}</span>
                        <span className="truncate max-w-[140px]" title={task.project.projectName}>{task.project.projectName}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-text-muted">{t("taskDrawer.projectPath")}</span>
                        <span className="break-all text-right max-w-[140px]" title={task.project.projectPath}>{task.project.projectPath}</span>
                      </div>
                      {task.scope && (
                        <div className="flex justify-between gap-4">
                          <span className="text-text-muted">{t("taskDrawer.scope")}</span>
                          <span className="bg-surface-900 px-2 rounded border border-border">{task.scope}</span>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                <section className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted">{t("taskDrawer.network")}</h4>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-text-muted">{t("taskDrawer.transport")}</span>
                      <span className="bg-surface-900 px-2 rounded border border-border">{transport}</span>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <section className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted">{t("taskDrawer.network")}</h4>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-text-muted">{t("taskDrawer.transport")}</span>
                  <span className="bg-surface-900 px-2 rounded border border-border">{transport}</span>
                </div>
              </section>
            )}
          </div>

          <div className="flex-1 flex flex-col bg-surface-900 overflow-hidden font-mono text-[12px]">
            {task ? (
              <>
                {isFinished ? (
                  <div className={`task-summary-strip ${summaryTone.containerClass}`}>
                    <div className="task-summary-main">
                      <div className={`task-summary-icon ${summaryTone.iconClass}`}>
                        <SummaryIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className={`task-summary-eyebrow ${summaryTone.eyebrowClass}`}>
                          {finishedLabel}
                        </div>
                        <p className="task-summary-title">
                          {summaryTitle}
                        </p>
                        <p className="task-summary-subtitle">
                          {task.status === "failed"
                            ? t("taskDrawer.failedSubtitle")
                            : t("taskDrawer.succeededSubtitle")}
                        </p>
                      </div>
                    </div>

                    <div className="task-summary-metrics">
                      <div className="task-summary-metric">
                        <span className="task-summary-metric-label">{t("taskDrawer.exitCode")}</span>
                        <span className={`task-summary-metric-value ${
                          typeof result?.exitCode === "number"
                            ? result.exitCode === 0 ? "text-success" : "text-danger"
                            : "text-text"
                        }`}>
                          {typeof result?.exitCode === "number" ? result.exitCode : "-"}
                        </span>
                      </div>
                      <div className="task-summary-metric">
                        <span className="task-summary-metric-label">{t("taskDrawer.duration")}</span>
                        <span className="task-summary-metric-value">{duration}</span>
                      </div>
                      <div className="task-summary-metric">
                        <span className="task-summary-metric-label">{t("taskDrawer.finished")}</span>
                        <span className="task-summary-metric-value">{formatTime(task.finishedAt, locale)}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {isFinished ? (
                  <div className="border-b border-border bg-surface-900/95 px-4 py-4 sm:px-6">
                    {result ? (
                      <ResultPanel
                        title={t("taskDrawer.finalResult")}
                        result={result}
                        error={task.error}
                        compact
                        tone={task.status === "failed" ? "failed" : "success"}
                      />
                    ) : (
                      <div className="rounded-2xl border border-border/80 bg-surface-800/40 px-4 py-5 text-sm text-text-muted">
                        {t("resultPanel.emptyOutput")}
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-[10px] uppercase font-bold tracking-[0.24em] text-text-muted">
                      {t("taskDrawer.outputStream")}
                    </h4>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">
                      {output.length} {t("taskDrawer.outputEntries")}
                    </span>
                  </div>

                  <div className="task-output-surface">
                    {output.length > 0 ? (
                      output.map((chunk, i) => (
                        <div key={i} className="flex gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-800/55 sm:gap-4">
                          <span className="task-output-time">
                            [{formatTime(chunk.timestamp, locale)}]
                          </span>
                          <span className={`task-output-stream ${
                            chunk.stream === "stderr" ? "text-danger" :
                            chunk.stream === "system" ? "text-accent-light" : "text-text-muted"
                          }`}>
                            {chunk.stream}
                          </span>
                          <span className="whitespace-pre-wrap break-all text-text">{chunk.text}</span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-surface-600/60 bg-surface-900/50 px-4 py-6 text-sm text-text-muted">
                        {t("resultPanel.emptyOutput")}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[12rem] items-center justify-center p-6">
                <div className="max-w-md rounded-2xl border border-border/70 bg-surface-800/60 px-6 py-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-800 text-accent">
                    <Terminal size={20} />
                  </div>
                  <h4 className="text-sm font-semibold tracking-tight text-text">{t("taskDrawer.idleTitle")}</h4>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{t("taskDrawer.idleDescription")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
