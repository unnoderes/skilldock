import React, { useMemo, useState } from "react";
import { Search, Download, ExternalLink } from "lucide-react";
import type { Scope, CommandResult } from "@skilldock/shared";
import { useLocale } from "../contexts/LocaleContext";
import { useSkillsFind } from "../hooks/useSkills";
import { SearchInput } from "./ui/SearchInput";
import { parseDiscoveryItems, stripAnsi } from "../lib/skillsDiscovery";

interface SkillsDiscoveryProps {
  scope: Scope;
  onRequestInstall: (packageName: string) => void;
  variant?: "card" | "plain";
}

export function SkillsDiscovery({ scope, onRequestInstall, variant = "card" }: SkillsDiscoveryProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const { data, isFetching: isLoading, error } = useSkillsFind(query);

  const result: CommandResult | undefined = data?.result;
  const hasSearched = query.trim().length > 0 && result !== undefined;
  const showSpinner = query.trim().length > 0 && isLoading;

  const isCard = variant === "card";

  const items = useMemo(() => {
    if (!result) return null;
    return parseDiscoveryItems(result.stdout);
  }, [result]);

  const cleanedStdout = useMemo(() => {
    if (!result) return "";
    return stripAnsi(result.stdout);
  }, [result]);
  return (
    <div className={isCard ? "space-y-4" : ""}>
      <div className={isCard ? "rounded-2xl bg-surface-800 border border-border p-6" : ""}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-surface-900 border border-border">
            <Search size={16} className="text-text-muted" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{t("skills.discoverTitle")}</h3>
            <p className="text-xs text-text-muted">
              {t("skills.installScope", { scope })}
            </p>
          </div>
        </div>

        <SearchInput
          placeholder={t("skills.discoverPlaceholder")}
          value={query}
          onChange={setQuery}
          className="w-full"
        />
      </div>

      {showSpinner && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-800 border border-border">
          <span className="inline-block w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <span className="text-xs text-text-muted">{t("skills.searching", { query })}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
          {error instanceof Error ? error.message : t("skills.searchError")}
        </div>
      )}

      {hasSearched && result && items && items.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {t("skills.discoverResults", { query })}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {items.map((item) => (
              <div
                key={item.skillId}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-surface-800 border border-border hover:border-accent/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-text truncate">{item.skillId}</span>
                    {item.installs && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-900 border border-border text-text-muted">
                        {item.installs}
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
                </div>
                <button
                  onClick={() => onRequestInstall(item.skillId)}
                  className="px-3 py-2 bg-accent text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0 self-start sm:self-center"
                >
                  <Download size={12} />
                  {t("skills.discoveryInstall")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasSearched && result && (!items || items.length === 0) && (
        <div className="p-6 text-center rounded-xl bg-surface-800 border border-border">
          <p className="text-sm text-text-muted">{t("skills.discoveryEmpty")}</p>
          {result.exitCode !== 0 && (
            <p className="text-xs text-danger mt-2">{t("skills.searchError")}</p>
          )}
          {cleanedStdout && (
            <pre className="mt-4 text-xs text-text-muted text-left bg-surface-900/50 p-3 rounded-lg border border-surface-600/50 overflow-auto max-h-64 whitespace-pre-wrap">
              {cleanedStdout}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
