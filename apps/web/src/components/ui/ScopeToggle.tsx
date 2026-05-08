import React from "react";
import type { Scope } from "@skilldock/shared";
import { useLocale } from "../../contexts/LocaleContext";

export function ScopeToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Scope;
  onChange: (scope: Scope) => void;
}) {
  const { locale } = useLocale();
  return (
    <div className="flex items-center gap-2" aria-label={label}>
      <div className="inline-flex rounded-lg bg-surface-800 p-1 border border-border">
        <button
          type="button"
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            value === "project"
              ? "bg-accent text-white shadow-sm"
              : "text-text-muted hover:text-text hover:bg-surface-600"
          }`}
          onClick={() => onChange("project")}
        >
          {locale === "zh-CN" ? "项目" : "Project"}
        </button>
        <button
          type="button"
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            value === "global"
              ? "bg-accent text-white shadow-sm"
              : "text-text-muted hover:text-text hover:bg-surface-600"
          }`}
          onClick={() => onChange("global")}
        >
          {locale === "zh-CN" ? "全局" : "Global"}
        </button>
      </div>
    </div>
  );
}
