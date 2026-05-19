import React from "react";
import { createPortal } from "react-dom";
import { Download, FolderTree, X } from "lucide-react";
import type { Scope } from "@skilldock/shared";
import { useLocale } from "../contexts/LocaleContext";
import { SkillsDiscovery } from "./SkillsDiscovery";
import type {
  DiscoveryInstallRequest,
  InstallPreviewPackageItem,
} from "../lib/skillsDiscovery";

export function SkillDiscoveryDialog({
  scope,
  onRequestInstall,
  onClose,
  previewPackage,
}: {
  scope: Scope;
  onRequestInstall: (request: DiscoveryInstallRequest) => void;
  onClose: () => void;
  previewPackage?: InstallPreviewPackageItem | null;
}) {
  const { t } = useLocale();
  const showPreviewPackage = Boolean(previewPackage);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/80 backdrop-blur-sm p-4">
      <div className="bg-surface-700 rounded-2xl border border-border shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">
              {showPreviewPackage ? t("skills.installFromPackage") : t("skills.discoverSkills")}
            </h3>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          {showPreviewPackage && previewPackage ? (
            <InstallPreviewSelection
              scope={scope}
              previewPackage={previewPackage}
              onRequestInstall={onRequestInstall}
            />
          ) : (
            <SkillsDiscovery
              scope={scope}
              onRequestInstall={onRequestInstall}
              variant="plain"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function InstallPreviewSelection({
  scope,
  previewPackage,
  onRequestInstall,
}: {
  scope: Scope;
  previewPackage: InstallPreviewPackageItem;
  onRequestInstall: (request: DiscoveryInstallRequest) => void;
}) {
  const { t } = useLocale();
  const [selectedSkillNames, setSelectedSkillNames] = React.useState<string[]>(
    previewPackage.availableSkills.map((skill) => skill.skillName),
  );
  const selectedNameSet = new Set(selectedSkillNames);

  React.useEffect(() => {
    setSelectedSkillNames(previewPackage.availableSkills.map((skill) => skill.skillName));
  }, [previewPackage]);

  const toggleSkill = (skillName: string) => {
    setSelectedSkillNames((current) => (
      current.includes(skillName)
        ? current.filter((value) => value !== skillName)
        : [...current, skillName]
    ));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface-800 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-text">
          <FolderTree size={14} className="text-text-muted" />
          <span>{previewPackage.packageName}</span>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {t("skills.installScope", { scope })}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {t("skills.installPreviewMonorepo", {
            count: String(previewPackage.availableSkills.length),
          })}
        </p>
        <p className="mt-1 text-xs text-text-muted">{t("skills.installPreviewMonorepoHint")}</p>
      </div>

      <div className="space-y-2">
        {previewPackage.availableSkills.map((skill) => (
          <label
            key={skill.skillName}
            className="flex gap-3 rounded-lg border border-border bg-surface-900/60 p-3 hover:border-accent/20"
          >
            <input
              type="checkbox"
              checked={selectedNameSet.has(skill.skillName)}
              onChange={() => toggleSkill(skill.skillName)}
              className="mt-0.5 h-4 w-4 rounded border-border bg-surface-900 text-accent focus:ring-accent"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-text">{skill.skillName}</div>
              {skill.description && (
                <p className="mt-1 text-xs text-text-muted">{skill.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-text-muted">
          {t("skills.discoverySelectedCount", { count: String(selectedSkillNames.length) })}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => onRequestInstall({
              packageName: previewPackage.packageName,
              installMode: "package",
            })}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            <Download size={12} />
            {t("skills.discoveryInstallAll")}
          </button>
          <button
            type="button"
            onClick={() => onRequestInstall({
              packageName: previewPackage.packageName,
              skillNames: selectedSkillNames,
              installMode: "selected-skills",
            })}
            disabled={selectedSkillNames.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-surface-700 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Download size={12} />
            {t("skills.discoveryInstallSelected")}
          </button>
        </div>
      </div>
    </div>
  );
}
