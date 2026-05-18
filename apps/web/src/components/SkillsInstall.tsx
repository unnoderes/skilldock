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

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Package
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder={t("skills.packagePlaceholder")}
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            className="h-10 w-full rounded-lg bg-surface-900 px-3 pl-11 pr-10 text-xs outline-none focus:ring-1 focus:ring-accent border-border"
          />
          {packageName && (
            <button
              type="button"
              onClick={() => setPackageName("")}
              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-800 hover:text-text"
              tabIndex={-1}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={!packageName.trim() || isPending}
          className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
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
