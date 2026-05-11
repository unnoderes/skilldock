import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, RefreshCw, ShieldCheck, Database, FileCode, Sun, Moon } from "lucide-react";
import type { SkillDockConfig, Scope } from "@skilldock/shared";
import { useSettings } from "../hooks/useSettings";
import { useTheme } from "../contexts/ThemeContext";
import { useLocale } from "../contexts/LocaleContext";
import { Languages } from "lucide-react";

export function Settings() {
  const { query, mutation } = useSettings();
  const { data, isLoading } = query;
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();

  const [formData, setFormData] = useState<Partial<SkillDockConfig>>({});
  const [activeTab, setActiveTab] = useState<"preferences" | "context">("preferences");

  useEffect(() => {
    if (data?.config) {
      setFormData(data.config);
    }
  }, [data]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-12 flex justify-center"><RefreshCw className="animate-spin text-accent" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      {/* Tab Switcher Header */}
      <div className="flex items-center gap-1 bg-surface-800 p-1.5 rounded-t-xl border-x border-t border-border w-fit ml-1">
        <button
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${
            activeTab === "preferences"
              ? "bg-accent text-white shadow-md"
              : "text-text-muted hover:text-text hover:bg-surface-700"
          }`}
        >
          <ShieldCheck size={16} />
          {t("settings.userPreferences")}
        </button>
        <button
          onClick={() => setActiveTab("context")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${
            activeTab === "context"
              ? "bg-accent text-white shadow-md"
              : "text-text-muted hover:text-text hover:bg-surface-700"
          }`}
        >
          <Database size={16} />
          {t("settings.systemContext")}
        </button>
      </div>

      <div className="bg-surface-800 border border-border rounded-xl rounded-tl-none overflow-hidden min-h-[500px]">
        {activeTab === "preferences" ? (
          <form onSubmit={handleSave} className="p-8 space-y-10 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
              {/* Left Column: Defaults & Display */}
              <div className="space-y-8">
                <div className="space-y-5">
                  <p className="text-[10px] uppercase font-bold text-text-muted/60 tracking-widest px-1">Default Scopes</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <label className="flex flex-col gap-2.5">
                      <span className="text-xs font-semibold">{t("settings.defaultSkillsScope")}</span>
                      <select
                        value={formData.defaultSkillsScope}
                        onChange={e => setFormData(p => ({ ...p, defaultSkillsScope: e.target.value as Scope }))}
                        className="bg-surface-900 border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent py-2.5 px-4 transition-shadow"
                      >
                        <option value="project">Project</option>
                        <option value="global">Global</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-2.5">
                      <span className="text-xs font-semibold">{t("settings.defaultMcpScope")}</span>
                      <select
                        value={formData.defaultMcpScope}
                        onChange={e => setFormData(p => ({ ...p, defaultMcpScope: e.target.value as Scope }))}
                        className="bg-surface-900 border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent py-2.5 px-4 transition-shadow"
                      >
                        <option value="project">Project</option>
                        <option value="global">Global</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="space-y-5 pt-6 border-t border-border/30">
                  <p className="text-[10px] uppercase font-bold text-text-muted/60 tracking-widest px-1">Display & Logs</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                    <label className="flex flex-col gap-2.5">
                      <span className="text-xs font-semibold">{t("settings.recentLogsLimit")}</span>
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={formData.defaultLogsLimit}
                        onChange={e => setFormData(p => ({ ...p, defaultLogsLimit: Number(e.target.value) }))}
                        className="bg-surface-900 border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent py-2.5 px-4 transition-shadow h-11"
                      />
                    </label>

                    <div className="flex flex-col gap-2.5">
                      <span className="text-xs font-semibold opacity-0 select-none">Placeholder</span>
                      <label className="flex items-center gap-3 px-4 rounded-lg bg-surface-900/50 border border-border/40 cursor-pointer select-none transition-all hover:bg-surface-900 hover:border-border/60 h-11">
                        <input
                          type="checkbox"
                          checked={formData.collapseRawOutput}
                          onChange={e => setFormData(p => ({ ...p, collapseRawOutput: e.target.checked }))}
                          className="w-4 h-4 rounded border-border text-accent focus:ring-0 focus:ring-offset-0 bg-surface-900"
                        />
                        <span className="text-xs font-medium text-text-muted">{t("settings.collapseRawOutput")}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Workspace Style */}
              <div className="space-y-8">
                <div className="space-y-5">
                  <p className="text-[10px] uppercase font-bold text-text-muted/60 tracking-widest px-1">Workspace Style</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-surface-900/50 border border-border/40">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{t("settings.appearance")}</span>
                        <span className="text-[10px] text-text-muted">{t("settings.appearanceDesc")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="px-5 py-2 bg-accent text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95"
                      >
                        {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                        {theme === 'dark' ? t("settings.lightMode") : t("settings.darkMode")}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-surface-900/50 border border-border/40">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{t("language.label")}</span>
                        <span className="text-[10px] text-text-muted">{t("language.description")}</span>
                      </div>
                      <div className="flex gap-1.5 p-1 bg-surface-700 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setLocale("en-US")}
                          className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                            locale === "en-US" ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-text"
                          }`}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocale("zh-CN")}
                          className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                            locale === "zh-CN" ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-text"
                          }`}
                        >
                          中文
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-border/30 flex justify-end">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full md:w-auto min-w-[200px] px-10 py-4 bg-accent text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all shadow-lg shadow-accent/10 active:scale-[0.98]"
              >
                {mutation.isPending ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                {t("settings.savePreferences")}
              </button>
            </div>
          </form>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="divide-y divide-border/40">
              <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] items-baseline px-8 py-6 gap-3 md:gap-6">
                <span className="text-xs uppercase font-bold text-text-muted/70 tracking-widest">{t("settings.configPath")}</span>
                <div className="relative group">
                  <code className="text-sm font-mono break-all text-text-muted selection:bg-accent/30 leading-relaxed block bg-surface-900/40 p-4 rounded-lg border border-border/20">
                    {data?.metadata.configPath}
                  </code>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] items-baseline px-8 py-6 gap-3 md:gap-6">
                <span className="text-xs uppercase font-bold text-text-muted/70 tracking-widest">{t("settings.logsPath")}</span>
                <div className="relative group">
                  <code className="text-sm font-mono break-all text-text-muted selection:bg-accent/30 leading-relaxed block bg-surface-900/40 p-4 rounded-lg border border-border/20">
                    {data?.metadata.logPath}
                  </code>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] items-center px-8 py-6 gap-3 md:gap-6">
                <span className="text-xs uppercase font-bold text-text-muted/70 tracking-widest">{t("settings.cliCommands")}</span>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-6 p-4 rounded-lg bg-surface-900/50 border border-border/20">
                    <span className="text-xs font-bold text-text-muted/60 px-1">{t("settings.skillsLabel")}</span>
                    <code className="text-xs font-mono text-accent-light/90">{data?.metadata.cliCommands.skills}</code>
                  </div>
                  <div className="flex items-center justify-between gap-6 p-4 rounded-lg bg-surface-900/50 border border-border/20">
                    <span className="text-xs font-bold text-text-muted/60 px-1">{t("settings.addMcpLabel")}</span>
                    <code className="text-xs font-mono text-accent-light/90">{data?.metadata.cliCommands.addMcp}</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-10 border-t border-border/40 bg-surface-900/20">
              <div className="p-6 rounded-lg bg-accent/5 border border-accent/20 max-w-2xl mx-auto">
                <p className="text-xs leading-relaxed text-accent-light/70 italic text-center">
                  {t("settings.securityNotice")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
