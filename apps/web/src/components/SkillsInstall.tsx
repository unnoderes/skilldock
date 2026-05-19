import React, { useState } from "react";
import { Download, FolderTree, Package, X } from "lucide-react";
import type { Scope } from "@skilldock/shared";
import { useLocale } from "../contexts/LocaleContext";
import { useSkillsInstallPreview } from "../hooks/useSkills";
import {
  parseInstallPreview,
  stripAnsi,
  type DiscoveryInstallRequest,
  type InstallPreviewPackageItem,
} from "../lib/skillsDiscovery";

interface SkillsInstallProps {
  scope: Scope;
  isPending: boolean;
  onInstallRequest: (request: DiscoveryInstallRequest) => void;
  onOpenPreviewSelection: (previewPackage: InstallPreviewPackageItem) => void;
  variant?: "card" | "plain";
}

export function SkillsInstall({
  scope,
  isPending,
  onInstallRequest,
  onOpenPreviewSelection,
  variant = "card",
}: SkillsInstallProps) {
  const { t } = useLocale();
  const [packageName, setPackageName] = useState("");
  const normalizedPackageName = packageName.trim();
  const previewQuery = useSkillsInstallPreview(normalizedPackageName);
  const previewResult = normalizedPackageName ? previewQuery.data?.result : undefined;
  const previewItem = previewResult
    ? parseInstallPreview(previewResult.stdout, normalizedPackageName)
    : null;
  const availableSkills = previewItem?.availableSkills ?? [];
  const selectedSkillCount = availableSkills.length;
  const cleanedPreviewOutput = previewResult ? stripAnsi(previewResult.stdout || previewResult.stderr) : "";
  const previewFailed = Boolean(previewResult && previewResult.exitCode !== 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedPackageName) return;

    const result = await previewQuery.refetch();
    const stdout = result.data?.result.stdout ?? "";
    const installPreview = parseInstallPreview(stdout, normalizedPackageName);
    const skills = installPreview?.availableSkills ?? [];

    if (installPreview && skills.length > 1) {
      onOpenPreviewSelection(installPreview);
      setPackageName("");
      return;
    }

    onInstallRequest({
      packageName: normalizedPackageName,
      skillNames: skills.length === 1 ? [skills[0].skillName] : undefined,
      installMode: skills.length === 1 ? "selected-skills" : "package",
    });
    setPackageName("");
  };

  const isCard = variant === "card";
  const showInlinePreview = normalizedPackageName.length > 0;
  const isPreviewLoading = previewQuery.isFetching;

  return (
    <div className={isCard ? "rounded-2xl border border-border bg-surface-800 p-6" : ""}>
      {isCard ? (
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg border border-accent/20 bg-accent/10 p-2">
            <Download size={16} className="text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{t("skills.install")}</h3>
            <p className="text-xs text-text-muted">
              {t("skills.installScope", { scope })}
            </p>
          </div>
        </div>
      ) : null}

      <form onSubmit={(event) => void handleSubmit(event)} className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center">
            <Package
              size={14}
              className="text-text-muted"
            />
          </div>
          <input
            type="text"
            placeholder={t("skills.packagePlaceholder")}
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            className="h-10 w-full min-w-0 rounded-lg border border-border bg-surface-900 pl-11 pr-11 text-xs leading-5 outline-none placeholder:text-text-muted focus:ring-1 focus:ring-accent"
            style={{
              paddingLeft: "2.75rem",
              paddingRight: "2.75rem",
            }}
          />
          {packageName && (
            <div className="absolute inset-y-0 right-0 flex w-10 items-center justify-center">
              <button
                type="button"
                onClick={() => setPackageName("")}
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-800 hover:text-text"
                tabIndex={-1}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!normalizedPackageName || isPending || isPreviewLoading}
          className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isPending || isPreviewLoading ? (
            <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {t("skills.install")}
        </button>
      </form>

      {showInlinePreview && (
        <div className="mt-3 rounded-xl border border-border bg-surface-900/50 p-3">
          {previewFailed ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-danger">{t("skills.installPreviewFailed")}</p>
              {cleanedPreviewOutput && (
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-danger/20 bg-danger/5 p-2 text-[11px] text-text-muted">
                  {cleanedPreviewOutput}
                </pre>
              )}
            </div>
          ) : previewItem && selectedSkillCount > 1 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-text">
                <FolderTree size={12} className="text-text-muted" />
                <span>
                  {t("skills.installPreviewMonorepo", { count: String(selectedSkillCount) })}
                </span>
              </div>
              <p className="text-xs text-text-muted">{t("skills.installPreviewMonorepoHint")}</p>
              <div className="flex flex-wrap gap-2">
                {availableSkills.slice(0, 6).map((skill) => (
                  <span
                    key={skill.skillName}
                    className="rounded-md border border-border bg-surface-800 px-2 py-1 text-[11px] font-semibold text-text-muted"
                  >
                    {skill.skillName}
                  </span>
                ))}
                {availableSkills.length > 6 && (
                  <span className="rounded-md border border-border bg-surface-800 px-2 py-1 text-[11px] font-semibold text-text-muted">
                    {t("skills.installPreviewMoreSkills", {
                      count: String(availableSkills.length - 6),
                    })}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-muted">{t("skills.installPreviewSubmitHint")}</p>
            </div>
          ) : previewItem && selectedSkillCount === 1 ? (
            <div className="space-y-1">
              <p className="text-xs font-bold text-text">
                {t("skills.installPreviewSingleSkill", { name: availableSkills[0].skillName })}
              </p>
              <p className="text-xs text-text-muted">{t("skills.installPreviewSingleHint")}</p>
            </div>
          ) : previewResult ? (
            <p className="text-xs text-text-muted">{t("skills.installPreviewDirectPackage")}</p>
          ) : (
            <p className="text-xs text-text-muted">{t("skills.installPreviewLoading")}</p>
          )}
        </div>
      )}
    </div>
  );
}
