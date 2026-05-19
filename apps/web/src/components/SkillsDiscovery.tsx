import React, { useEffect, useMemo, useState } from "react";
import { Search, Download, ExternalLink, FolderTree } from "lucide-react";
import type { Scope, CommandResult } from "@skilldock/shared";
import { useLocale } from "../contexts/LocaleContext";
import { useSkillsFind } from "../hooks/useSkills";
import { SearchInput } from "./ui/SearchInput";
import {
  parseDiscoveryItems,
  stripAnsi,
  type DiscoveryInstallRequest,
  type DiscoveryPackageItem,
} from "../lib/skillsDiscovery";

interface SkillsDiscoveryProps {
  scope: Scope;
  onRequestInstall: (request: DiscoveryInstallRequest) => void;
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

  const [selectedSkillIdsByPackage, setSelectedSkillIdsByPackage] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setSelectedSkillIdsByPackage({});
  }, [query, result?.stdout]);

  const cleanedStdout = useMemo(() => {
    if (!result) return "";
    return stripAnsi(result.stdout);
  }, [result]);

  const toggleSkillSelection = (packageName: string, skillId: string) => {
    setSelectedSkillIdsByPackage((current) => {
      const currentSelection = current[packageName] ?? [];
      const nextSelection = currentSelection.includes(skillId)
        ? currentSelection.filter((value) => value !== skillId)
        : [...currentSelection, skillId];

      return {
        ...current,
        [packageName]: nextSelection,
      };
    });
  };

  const getSelectedSkillNames = (item: DiscoveryPackageItem): string[] => {
    const selectedIds = new Set(selectedSkillIdsByPackage[item.packageName] ?? []);
    return item.matchedSkills
      .filter((skill) => selectedIds.has(skill.skillId))
      .map((skill) => skill.skillName)
      .filter((value): value is string => Boolean(value));
  };

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
                key={item.packageName}
                className="flex flex-col gap-4 rounded-xl bg-surface-800 border border-border p-4 hover:border-accent/30 transition-colors"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-text truncate">
                        <FolderTree size={14} className="text-text-muted" />
                        {item.packageName}
                      </span>
                      {item.matchedSkills.length > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-accent-light">
                          {t("skills.discoveryMonorepoBadge", {
                            count: String(item.matchedSkills.length),
                          })}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {item.matchedSkills.length > 1
                        ? t("skills.discoveryMonorepoHint")
                        : t("skills.discoverySingleSkillHint")}
                    </p>
                  </div>

                  <button
                    onClick={() => onRequestInstall({
                      packageName: item.packageName,
                      installMode: "package",
                    })}
                    className="px-3 py-2 bg-accent text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0 self-start"
                  >
                    <Download size={12} />
                    {item.matchedSkills.length > 1
                      ? t("skills.discoveryInstallAll")
                      : t("skills.discoveryInstall")}
                  </button>
                </div>

                <div className="space-y-2">
                  {item.matchedSkills.map((skill) => {
                    const selectable = Boolean(skill.skillName);
                    const checked = (selectedSkillIdsByPackage[item.packageName] ?? []).includes(skill.skillId);

                    return (
                      <label
                        key={skill.skillId}
                        className={`flex gap-3 rounded-lg border border-border bg-surface-900/60 p-3 ${
                          selectable ? "cursor-pointer hover:border-accent/20" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!selectable}
                          onChange={() => toggleSkillSelection(item.packageName, skill.skillId)}
                          className="mt-0.5 h-4 w-4 rounded border-border bg-surface-900 text-accent focus:ring-accent"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-text truncate">
                              {skill.skillName ?? skill.skillId}
                            </span>
                            {skill.installs && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-800 border border-border text-text-muted">
                                {skill.installs}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 font-mono text-[11px] text-text-muted break-all">
                            {skill.skillId}
                          </p>
                          {skill.url && (
                            <a
                              href={skill.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs text-accent-light hover:underline"
                            >
                              <ExternalLink size={10} />
                              {skill.url}
                            </a>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {item.matchedSkills.some((skill) => skill.skillName) && (
                  <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-text-muted">
                      {t("skills.discoverySelectedCount", {
                        count: String(getSelectedSkillNames(item).length),
                      })}
                    </p>
                    <button
                      onClick={() => onRequestInstall({
                        packageName: item.packageName,
                        skillNames: getSelectedSkillNames(item),
                        installMode: "selected-skills",
                      })}
                      disabled={getSelectedSkillNames(item).length === 0}
                      className="px-3 py-2 rounded-lg border border-border text-xs font-bold flex items-center gap-2 hover:bg-surface-700 transition-colors disabled:opacity-50 disabled:hover:bg-transparent shrink-0 self-start"
                    >
                      <Download size={12} />
                      {t("skills.discoveryInstallSelected")}
                    </button>
                  </div>
                )}
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
