import React, { useMemo } from "react";
import { Server, ChevronDown, ExternalLink } from "lucide-react";
import type { CommandResult } from "@skilldock/shared";
import { useLocale } from "../contexts/LocaleContext";
import { parseMcpServers, cleanedMcpOutput } from "../lib/mcpOutput";
import { EmptyState } from "./ui/EmptyState";
import { CommandResultView } from "./ui/CommandResultView";

export function McpServerList({ result, scope }: { result: CommandResult; scope?: string }) {
  const { t } = useLocale();

  const items = useMemo(() => parseMcpServers(result.stdout), [result.stdout]);
  const cleanedLines = useMemo(() => cleanedMcpOutput(result.stdout), [result.stdout]);

  const hasContent = items && items.length > 0;
  const hasCleanedLines = cleanedLines.length > 0;

  return (
    <div className="space-y-4">
      {hasContent ? (
        <div className="grid grid-cols-1 gap-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 p-4 rounded-xl bg-surface-800 border border-border hover:border-accent/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-surface-900 border border-border shrink-0">
                  <Server size={14} className="text-accent-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-text truncate">{item.title}</span>
                    {item.transport && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-900 border border-border text-text-muted uppercase tracking-wider">
                        {item.transport}
                      </span>
                    )}
                    {item.scope && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-900 border border-border text-text-muted uppercase tracking-wider">
                        {item.scope}
                      </span>
                    )}
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent-light hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink size={10} />
                      {item.url}
                    </a>
                  )}
                  {item.lines.length > 1 && (
                    <div className="mt-1.5 space-y-0.5">
                      {item.lines.slice(1).map((line, i) => (
                        <p key={i} className="text-[11px] text-text-muted leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : hasCleanedLines ? (
        <div className="grid grid-cols-1 gap-3">
          {cleanedLines.map((line, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-800 border border-border hover:border-accent/30 transition-colors"
            >
              <div className="p-1.5 rounded-md bg-surface-900 border border-border shrink-0">
                <Server size={12} className="text-text-muted" />
              </div>
              <span className="text-xs text-text truncate">{line}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={t("mcp.noMcpConfig")} message={t("mcp.unableToFetch")} />
      )}

      {/* Secondary raw details */}
      <details className="group">
        <summary className="flex items-center gap-1.5 text-[11px] text-accent-light cursor-pointer hover:underline select-none">
          <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
          {t("resultPanel.fullDetails")}
        </summary>
        <div className="mt-3">
          <CommandResultView
            title={t("mcp.configuredServers")}
            description={t("mcp.configuredServersDesc")}
            result={result}
            scope={scope}
          />
        </div>
      </details>
    </div>
  );
}
