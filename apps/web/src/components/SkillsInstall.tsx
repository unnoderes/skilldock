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

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
