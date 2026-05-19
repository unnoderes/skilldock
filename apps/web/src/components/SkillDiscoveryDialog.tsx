import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Scope } from "@skilldock/shared";
import { useLocale } from "../contexts/LocaleContext";
import { SkillsDiscovery } from "./SkillsDiscovery";
import type { DiscoveryInstallRequest } from "../lib/skillsDiscovery";

export function SkillDiscoveryDialog({
  scope,
  onRequestInstall,
  onClose,
}: {
  scope: Scope;
  onRequestInstall: (request: DiscoveryInstallRequest) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/80 backdrop-blur-sm p-4">
      <div className="bg-surface-700 rounded-2xl border border-border shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">{t("skills.discoverSkills")}</h3>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <SkillsDiscovery
            scope={scope}
            onRequestInstall={onRequestInstall}
            variant="plain"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
