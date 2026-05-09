import React, { useState } from "react";
import { Search } from "lucide-react";
import type { Scope, CommandResult } from "@skilldock/shared";
import { useLocale } from "../contexts/LocaleContext";
import { useSkillsFind } from "../hooks/useSkills";
import { ResultPanel } from "./ui/ResultPanel";
import { SearchInput } from "./ui/SearchInput";

interface SkillsDiscoveryProps {
  scope: Scope;
  onRequestInstall: (packageName: string) => void;
}

export function SkillsDiscovery({ scope, onRequestInstall }: SkillsDiscoveryProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const { data, isFetching: isLoading, error } = useSkillsFind(query);

  const result: CommandResult | undefined = data?.result;
  const hasSearched = query.trim().length > 0 && result !== undefined;
  const showSpinner = query.trim().length > 0 && isLoading;

  const extractPackageNames = (stdout: string): string[] => {
    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("━"));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-surface-800 border border-border p-6">
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

      {hasSearched && result && (
        <ResultPanel
          title={t("skills.discoverResults", { query })}
          result={result}
          error={result.exitCode !== 0 ? result.stderr : undefined}
          compact={false}
          collapseRawOutput={true}
        />
      )}

      {hasSearched && result && result.exitCode === 0 && result.stdout && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
            {t("skills.discoverInstallHint")}
          </p>
          <div className="flex flex-wrap gap-2">
            {extractPackageNames(result.stdout).map((pkg) => (
              <button
                key={pkg}
                onClick={() => onRequestInstall(pkg)}
                className="px-3 py-1.5 rounded-lg bg-surface-800 border border-border hover:border-accent/50 hover:bg-accent/5 text-xs font-mono text-text hover:text-accent transition-all"
              >
                {pkg}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
