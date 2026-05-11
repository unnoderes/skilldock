import React, { useState } from "react";
import { Download, Package, X } from "lucide-react";
import type { Scope } from "@skilldock/shared";
import { useLocale } from "../contexts/LocaleContext";

interface SkillsInstallProps {
  scope: Scope;
  isPending: boolean;
  onInstall: (packageName: string) => void;
  variant?: "card" | "plain";
}

export function SkillsInstall({ scope, isPending, onInstall, variant = "card" }: SkillsInstallProps) {
  const { t } = useLocale();
  const [packageName, setPackageName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName.trim()) return;
    onInstall(packageName.trim());
    setPackageName("");
  };

  const isCard = variant === "card";

  return (
    <div className={isCard ? "rounded-2xl bg-surface-800 border border-border p-6" : ""}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
          <Download size={16} className="text-accent" />
        </div>
        <div>
          <h3 className="text-sm font-bold">{t("skills.install")}</h3>
          <p className="text-xs text-text-muted">
            {t("skills.installScope", { scope })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Package
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder={t("skills.packagePlaceholder")}
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            className="w-full pl-10 pr-8 py-2 text-xs bg-surface-900 border-border focus:ring-1 focus:ring-accent outline-none rounded-lg"
          />
          {packageName && (
            <button
              type="button"
              onClick={() => setPackageName("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
              tabIndex={-1}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={!packageName.trim() || isPending}
          className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shrink-0"
        >
          {isPending ? (
            <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {t("skills.install")}
        </button>
      </form>
    </div>
  );
}
