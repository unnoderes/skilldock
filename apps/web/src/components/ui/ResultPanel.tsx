import React, { useEffect, useMemo, useState } from "react";
import type { CommandResult } from "@skilldock/shared";
import { useLocale } from "../../contexts/LocaleContext";
import {
  buildResultOutputSections,
  type ResultOutputSection,
} from "../../lib/outputNormalization";

type ResultViewMode = "clean" | "raw";

const STREAM_LABEL_KEY: Record<ResultOutputSection["key"], "resultPanel.error" | "resultPanel.stdout" | "resultPanel.stderr"> = {
  error: "resultPanel.error",
  stdout: "resultPanel.stdout",
  stderr: "resultPanel.stderr",
};

export function ResultPanel({
  title,
  result,
  error,
  compact,
}: {
  title: string;
  result: CommandResult;
  error?: string;
  compact?: boolean;
  collapseRawOutput?: boolean;
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
    <div className={`flex flex-col gap-3 rounded-xl border bg-surface-800 p-4 ${error ? "border-danger/30" : "border-border"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col">
          <span className="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">{title}</span>
          <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
            <span>exitCode: <span className={result.exitCode === 0 ? "text-success" : "text-danger"}>{result.exitCode}</span></span>
            <span>{t("resultPanel.duration")}: {result.durationMs}ms</span>
          </div>
        </div>

        <div className="inline-flex self-start rounded-lg border border-surface-600/50 bg-surface-900/50 p-1">
          <button
            type="button"
            onClick={() => setViewMode("clean")}
            className={`rounded-md px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
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
            className={`rounded-md px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
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
              <section key={section.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isErrorStream ? "text-danger/80" : "text-text-muted"
                  }`}>
                    {t(STREAM_LABEL_KEY[section.key])}
                  </span>
                </div>
                <pre
                  className={`overflow-auto rounded-lg border p-3 text-xs whitespace-pre-wrap break-all ${
                    compact ? "max-h-56" : "max-h-72"
                  } ${
                    isErrorStream
                      ? "border-danger/20 bg-danger/5"
                      : "border-surface-600/50 bg-surface-900/50"
                  }`}
                >
                  {content}
                </pre>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-surface-600/50 bg-surface-900/40 px-4 py-5 text-sm text-text-muted">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
