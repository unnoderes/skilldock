import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Scope } from "@skilldock/shared";
import { useLocale } from "../contexts/LocaleContext";
import { SkillsInstall } from "./SkillsInstall";
import type { DiscoveryInstallRequest, InstallPreviewPackageItem } from "../lib/skillsDiscovery";

export function SkillInstallDialog({
  scope,
  isPending,
  onInstallRequest,
  onOpenPreviewSelection,
  onClose,
}: {
  scope: Scope;
  isPending: boolean;
  onInstallRequest: (request: DiscoveryInstallRequest) => void;
  onOpenPreviewSelection: (previewPackage: InstallPreviewPackageItem) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/80 backdrop-blur-sm p-4">
      <div className="bg-surface-700 rounded-2xl border border-border shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">{t("skills.installFromPackage")}</h3>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <SkillsInstall
            scope={scope}
            isPending={isPending}
            onInstallRequest={(request) => {
              onInstallRequest(request);
              onClose();
            }}
            onOpenPreviewSelection={onOpenPreviewSelection}
            variant="plain"
            showInlinePreview={false}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
