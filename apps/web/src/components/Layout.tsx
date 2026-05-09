import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TaskDrawer } from "./TaskDrawer";
import { useTheme } from "../contexts/ThemeContext";
import { useLocale } from "../contexts/LocaleContext";
import { Sun, Moon, Languages } from "lucide-react";
import type { TaskRecord } from "@skilldock/shared";

type ActiveTask = {
  title: string;
  task: TaskRecord;
  transport: "sse" | "polling";
};

export function Layout({
  children,
  currentView,
  setView,
  activeTask,
  onCloseTask,
}: {
  children: React.ReactNode;
  currentView: string;
  setView: (v: string) => void;
  activeTask: ActiveTask | null;
  onCloseTask: () => void;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { locale, toggleLocale, t } = useLocale();

  const viewTitles: Record<string, string> = {
    overview: t("nav.overview"),
    skills: t("nav.skills"),
    mcp: t("nav.mcp"),
    logs: t("nav.logs"),
    settings: t("nav.settings"),
  };

  return (
    <div className="flex min-h-screen bg-surface-900 text-text selection:bg-accent selection:text-white">
      <Sidebar currentView={currentView} setView={setView} />

      <main className="flex-1 flex flex-col relative overflow-x-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-surface-900/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold tracking-tight capitalize">{viewTitles[currentView] ?? currentView}</h2>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold font-mono">/ {currentView}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLocale}
              className="px-2 py-1 rounded-lg hover:bg-surface-700 text-text-muted hover:text-text transition-colors text-xs font-bold"
              title={locale === "en-US" ? "切换到中文" : "Switch to English"}
              aria-label={locale === "en-US" ? "切换到中文" : "Switch to English"}
            >
              <Languages size={14} className="mr-1 inline" />
              {locale === "en-US" ? "中" : "EN"}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-surface-700 text-text-muted hover:text-text transition-colors"
              title={theme === 'dark' ? t("layout.switchToLightTheme") : t("layout.switchToDarkTheme")}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <div className="flex-1 p-8 pb-32">
          {children}
        </div>

        <TaskDrawer
          activeTask={activeTask}
          onClose={onCloseTask}
          isOpen={isDrawerOpen}
          setIsOpen={setIsDrawerOpen}
        />
      </main>
    </div>
  );
}
