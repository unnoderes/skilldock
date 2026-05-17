import React, { useEffect, useMemo, useState } from "react";
import type { CommandResult } from "@skilldock/shared";
import { useLocale } from "../../contexts/LocaleContext";
import {
  buildResultOutputSections,
  type ResultOutputSection,
} from "../../lib/outputNormalization";

type ResultViewMode = "clean" | "raw";
type ResultPanelTone = "default" | "success" | "failed";

const STREAM_LABEL_KEY: Record<ResultOutputSection["key"], "resultPanel.error" | "resultPanel.stdout" | "resultPanel.stderr"> = {
  error: "resultPanel.error",
  stdout: "resultPanel.stdout",
  stderr: "resultPanel.stderr",
};

const PANEL_TONE_CLASS: Record<ResultPanelTone, string> = {
  default: "border-border/80 bg-surface-800/40",
  success: "border-success/15 bg-success/5",
  failed: "border-danger/20 bg-danger/5",
};

export function ResultPanel({
  title,
  result,
  error,
  compact,
  tone = "default",
}: {
  title: string;
  result: CommandResult;
  error?: string;
  compact?: boolean;
  collapseRawOutput?: boolean;
  tone?: ResultPanelTone;
}) {
  const { t } = useLocale();
  const [viewMode, setViewMode] = useState<ResultViewMode>("clean");

  useEffect(() => {
    setViewMode("clean");
  }, [error, result.command, result.durationMs, result.exitCode, result.stderr, result.stdout]);

  const outputSections = useMemo(
    () => buildResultOutputSections(result, error),
    [error, result],
  );

  const visibleSections = outputSections.filter((section) => {
    const content = viewMode === "clean" ? section.cleanText : section.rawText;
    return content.trim().length > 0;
  });

  const emptyMessage = viewMode === "clean"
    ? t("resultPanel.emptyCleanOutput")
    : t("resultPanel.emptyRawOutput");

  return (
    <section className={`flex flex-col gap-4 rounded-2xl border px-4 py-4 sm:px-5 ${PANEL_TONE_CLASS[tone]}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted">{title}</span>
            <span className="rounded-full border border-border/70 bg-surface-900/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-text-muted">
              {t("resultPanel.outputView")}
            </span>
          </div>
          <p className="text-sm text-text-muted">
            {t("resultPanel.outputDescription")}
          </p>
        </div>

        <div className="inline-flex self-start rounded-xl border border-surface-600/50 bg-surface-900/60 p-1">
          <button
            type="button"
            onClick={() => setViewMode("clean")}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
              viewMode === "clean"
                ? "bg-accent text-white shadow-sm"
                : "text-text-muted hover:bg-surface-700 hover:text-text"
            }`}
          >
            {t("resultPanel.cleanOutput")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("raw")}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
              viewMode === "raw"
                ? "bg-accent text-white shadow-sm"
                : "text-text-muted hover:bg-surface-700 hover:text-text"
            }`}
          >
            {t("resultPanel.rawOutput")}
          </button>
        </div>
      </div>

      {visibleSections.length > 0 ? (
        <div className="space-y-3">
          {visibleSections.map((section) => {
            const content = viewMode === "clean" ? section.cleanText : section.rawText;
            const isErrorStream = section.key === "error" || section.key === "stderr";

            return (
              <section key={section.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${
                    isErrorStream ? "text-danger" : "text-text-muted"
                  }`}>
                    {t(STREAM_LABEL_KEY[section.key])}
                  </span>
                </div>
                <pre
                  className={`task-result-output ${
                    compact ? "max-h-56" : "max-h-72"
                  } ${
                    isErrorStream
                      ? "task-result-output--error"
                      : "task-result-output--neutral"
                  }`}
                >
                  {content}
                </pre>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-surface-600/50 bg-surface-900/35 px-4 py-5 text-sm text-text-muted">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
