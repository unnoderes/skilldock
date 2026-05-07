import * as React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Wrench,
  Box,
  FileText,
  Settings,
  Terminal,
  Activity
} from "lucide-react";
import { cn } from "../../lib/utils";
import { StatusIndicator } from "../ui/StatusIndicator";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", to: "/" },
  { icon: Wrench, label: "Skills", to: "/skills" },
  { icon: Box, label: "MCP", to: "/mcp" },
  { icon: FileText, label: "Logs", to: "/logs" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

export const Sidebar = () => {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 px-6 py-8">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
          <Terminal size={20} strokeWidth={2.5} />
        </div>
        <span className="text-lg font-bold tracking-tight">SkillDock</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-foreground/60 hover:bg-white/5 hover:text-white"
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4 space-y-4">
        <div className="bg-panel/50 rounded-lg p-3 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">CLI Status</span>
            <StatusIndicator status="online" />
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground/70">
            <Activity size={12} className="text-primary" />
            <span>npx skills v1.2.4</span>
          </div>
        </div>

        <div className="px-2 text-[10px] text-foreground/30 font-mono text-center">
          SKILLDOCK v0.1.0-alpha
        </div>
      </div>
    </aside>
  );
};
