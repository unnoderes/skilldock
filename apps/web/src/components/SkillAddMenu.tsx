import React, { useState, useEffect, useRef } from "react";
import { Plus, Package, Search } from "lucide-react";
import { useLocale } from "../contexts/LocaleContext";

export function SkillAddMenu({
  onInstall,
  onDiscover,
}: {
  onInstall: () => void;
  onDiscover: () => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
      >
        <Plus size={14} />
        {t("skills.addSkill")}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl bg-surface-700 border border-border shadow-2xl z-50 overflow-hidden">
          <button
            onClick={() => {
              setOpen(false);
              onInstall();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-text hover:bg-surface-600 transition-colors text-left"
          >
            <Package size={14} className="text-accent shrink-0" />
            {t("skills.installFromPackage")}
          </button>
          <div className="border-t border-border" />
          <button
            onClick={() => {
              setOpen(false);
              onDiscover();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-text hover:bg-surface-600 transition-colors text-left"
          >
            <Search size={14} className="text-accent shrink-0" />
            {t("skills.discoverSkills")}
          </button>
        </div>
      )}
    </div>
  );
}
