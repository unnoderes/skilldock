import React from "react";
import type { CommandResult } from "@skilldock/shared";
import { useLocale } from "../../contexts/LocaleContext";

export function ResultPanel({
  title,
  result,
  error,
}: {
  title: string;
  result: CommandResult;
  error?: string;
  compact?: boolean;
  collapseRawOutput?: boolean;
}) {
  const { t } = useLocale();
  const primaryOutput = error || result.stderr || result.stdout || `exit ${result.exitCode}`;

  return (
    <div className={`flex flex-col gap-3 p-4 rounded-xl border bg-surface-800 ${error ? 'border-danger/30' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">{title}</span>
          <div className="flex items-center gap-3 text-xs text-text-muted font-mono">
            <span>exitCode: <span className={result.exitCode === 0 ? "text-success" : "text-danger"}>{result.exitCode}</span></span>
            <span>{t("resultPanel.duration")}: {result.durationMs}ms</span>
          </div>
        </div>
      </div>

      <pre className="text-xs overflow-auto max-h-64 bg-surface-900/50 p-3 rounded-lg border border-surface-600/50">
        {primaryOutput || t("resultPanel.emptyOutput")}
      </pre>

      {/* Full stdout/stderr details are intentionally hidden for the current UI. */}
    </div>
  );
}
