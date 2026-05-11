import React from "react";
import type { CommandResult } from "@skilldock/shared";
import { useLocale } from "../../contexts/LocaleContext";

function countLines(text: string): number {
  if (!text.trim()) return 0;
  return text.split("\n").length;
}

export function CommandResultView({
  title,
  description,
  result,
  scope,
}: {
  title: string;
  description?: string;
  result: CommandResult;
  scope?: string;
}) {
  const { t } = useLocale();
  const stdoutLines = countLines(result.stdout);
  const stderrLines = countLines(result.stderr);
  const success = result.exitCode === 0;

  return (
    <div className="rounded-xl border bg-surface-800 border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">{title}</h4>
          {description && (
            <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {scope && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-700 text-text-muted font-mono uppercase">
              {scope}
            </span>
          )}
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              success ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            }`}
          >
            {success ? "exit 0" : `exit ${result.exitCode}`}
          </span>
          <span className="text-[10px] text-text-muted font-mono">{result.durationMs}ms</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* stdout */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-text-muted">
              {t("logs.standardOutput")}
            </span>
            <span className="text-[10px] text-text-muted font-mono">
              {stdoutLines > 0
                ? `${stdoutLines} ${stdoutLines === 1 ? t("logs.records") : t("logs.records")}`
                : t("mcp.noOutput")}
            </span>
          </div>
          {result.stdout ? (
            <pre className="text-[11px] max-h-48 overflow-auto bg-surface-900/50 p-3 rounded-lg border border-surface-600/30">
              {result.stdout}
            </pre>
          ) : (
            <div className="text-[11px] text-text-muted italic p-3 rounded-lg border border-dashed border-surface-600/30">
              {t("mcp.noOutput")}
            </div>
          )}
        </div>

        {/* stderr */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-danger/70">
              {t("logs.standardError")}
            </span>
            <span className="text-[10px] text-text-muted font-mono">
              {stderrLines > 0
                ? `${stderrLines} ${stderrLines === 1 ? t("logs.records") : t("logs.records")}`
                : t("mcp.noErrors")}
            </span>
          </div>
          {result.stderr ? (
            <pre className="text-[11px] max-h-48 overflow-auto bg-danger/5 p-3 rounded-lg border border-danger/20 text-danger">
              {result.stderr}
            </pre>
          ) : (
            <div className="text-[11px] text-text-muted italic p-3 rounded-lg border border-dashed border-surface-600/30">
              {t("mcp.noErrors")}
            </div>
          )}
        </div>
      </div>

      {/* Raw details */}
      <details className="group border-t border-border">
        <summary className="px-4 py-2.5 text-[11px] text-accent-light cursor-pointer hover:underline list-none flex items-center gap-1.5 select-none">
          <span className="inline-block transition-transform group-open:rotate-90">▶</span>
          {t("resultPanel.fullDetails")}
        </summary>
        <div className="px-4 py-3 space-y-3 bg-surface-900/20">
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
            <span className="text-text-muted font-mono">{t("logs.command")}</span>
            <span className="font-mono text-text">{result.command}</span>
            <span className="text-text-muted font-mono">{t("logs.args")}</span>
            <span className="font-mono text-text break-all">{result.args.join(" ")}</span>
            <span className="text-text-muted font-mono">{t("logs.exitCode")}</span>
            <span className={`font-mono font-bold ${success ? "text-success" : "text-danger"}`}>
              {result.exitCode}
            </span>
            <span className="text-text-muted font-mono">{t("logs.duration")}</span>
            <span className="font-mono text-text">{result.durationMs}ms</span>
          </div>

          {result.stdout && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">{t("logs.standardOutput")}</span>
              <pre className="text-[11px] p-2 max-h-40">{result.stdout}</pre>
            </div>
          )}

          {result.stderr && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-text-muted">{t("logs.standardError")}</span>
              <pre className="text-[11px] p-2 max-h-40 text-danger">{result.stderr}</pre>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
