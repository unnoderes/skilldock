import React, { useMemo } from "react";
import { Bot } from "lucide-react";
import type { CommandResult } from "@skilldock/shared";
import { useLocale } from "../contexts/LocaleContext";
import { parseMcpAgents, cleanedMcpOutput } from "../lib/mcpOutput";
import { EmptyState } from "./ui/EmptyState";

export function McpAgentList({ result }: { result: CommandResult }) {
  const { t } = useLocale();

  const items = useMemo(() => parseMcpAgents(result.stdout), [result.stdout]);
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
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-surface-800 border border-border hover:border-accent/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="p-1.5 rounded-md bg-surface-900 border border-border shrink-0">
                    <Bot size={12} className="text-warning" />
                  </div>
                  <span className="text-sm font-bold text-text truncate">{item.name}</span>
                </div>
                {item.description && (
                  <p className="text-xs text-text-muted mt-1 ml-7 leading-relaxed">
                    {item.description}
                  </p>
                )}
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
                <Bot size={12} className="text-text-muted" />
              </div>
              <span className="text-xs text-text truncate">{line}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={t("mcp.noAgentsFound")} message={t("mcp.couldNotRetrieve")} />
      )}

      {/* Secondary raw details are intentionally hidden for the current UI. */}
    </div>
  );
}
