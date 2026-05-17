import React from "react";
import type { CliStatus } from "@skilldock/shared";
import {
  LayoutDashboard,
  Package,
  Zap,
  History,
  Settings,
  Activity
} from "lucide-react";
import { useStatus } from "../hooks/useStatus";
import { useLocale } from "../contexts/LocaleContext";

export function Sidebar({ currentView, setView }: { currentView: string, setView: (v: string) => void }) {
  const { data: status } = useStatus();
  const { t } = useLocale();

  const navItems = [
    { id: "overview", label: t("nav.overview"), icon: LayoutDashboard },
    { id: "skills", label: t("nav.skills"), icon: Package },
    { id: "mcp", label: t("nav.mcp"), icon: Zap },
    { id: "logs", label: t("nav.logs"), icon: History },
    { id: "settings", label: t("nav.settings"), icon: Settings },
  ];

  const allAvailable = status?.cli.every((cli: CliStatus) => cli.available);

  return (
    <aside className="w-64 bg-surface-800 border-r border-border flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6 border-b border-border mb-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center font-bold text-white text-xs">SD</div>
          <h1 className="font-bold tracking-tight text-lg">SkillDock</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${allAvailable ? "bg-success" : "bg-danger animate-pulse"}`} />
          <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
            CLI {allAvailable ? t("sidebar.cliOperational") : t("sidebar.cliDegraded")}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              currentView === item.id
                ? "bg-accent/10 text-accent font-semibold"
                : "text-text-muted hover:text-text hover:bg-surface-700"
            }`}
          >
            <item.icon size={18} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-border space-y-4">
        <div className="pt-2 flex items-center gap-2 text-text-muted">
          <Activity size={12} />
          <span className="text-[10px]">v1.0.1</span>
        </div>
      </div>
    </aside>
  );
}
