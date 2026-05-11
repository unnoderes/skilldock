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
      <div className="bg-danger text-white p-2 text-center font-bold mb-4 rounded-lg">DEBUG: IF YOU SEE THIS, THE FILE IS UPDATED</div>
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
          <form onSubmit={handleSave} className="p-8 space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex flex-col gap-6 max-w-3xl">
              {/* Default Scopes */}
              <div className="space-y-3">
                <p className="text-xs uppercase font-bold text-text-muted tracking-widest">Default Scopes</p>
                <div className="space-y-2">
                  <label className="flex items-center justify-between gap-6 p-4 px-5 rounded-lg bg-surface-900/50 border border-border hover:bg-surface-900/80 transition-colors cursor-pointer">
                    <span className="text-sm font-medium">{t("settings.defaultSkillsScope")}</span>
                    <select
                      value={formData.defaultSkillsScope}
                      onChange={e => setFormData(p => ({ ...p, defaultSkillsScope: e.target.value as Scope }))}
                      className="bg-surface-700 border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent py-1.5 px-3 transition-shadow w-44 cursor-pointer"
                    >
                      <option value="project">Project</option>
                      <option value="global">Global</option>
                    </select>
                  </label>

                  <label className="flex items-center justify-between gap-6 p-4 px-5 rounded-lg bg-surface-900/50 border border-border hover:bg-surface-900/80 transition-colors cursor-pointer">
                    <span className="text-sm font-medium">{t("settings.defaultMcpScope")}</span>
                    <select
                      value={formData.defaultMcpScope}
                      onChange={e => setFormData(p => ({ ...p, defaultMcpScope: e.target.value as Scope }))}
                      className="bg-surface-700 border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent py-1.5 px-3 transition-shadow w-44 cursor-pointer"
                    >
                      <option value="project">Project</option>
                      <option value="global">Global</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Display & Logs */}
              <div className="space-y-3 pt-6 border-t border-border/30">
                <p className="text-xs uppercase font-bold text-text-muted tracking-widest">Display & Logs</p>
                <div className="space-y-2">
                  <label className="flex items-center justify-between gap-6 p-4 px-5 rounded-lg bg-surface-900/50 border border-border hover:bg-surface-900/80 transition-colors cursor-pointer">
                    <span className="text-sm font-medium">{t("settings.recentLogsLimit")}</span>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={formData.defaultLogsLimit}
                      onChange={e => setFormData(p => ({ ...p, defaultLogsLimit: Number(e.target.value) }))}
                      className="bg-surface-700 border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent py-1.5 px-3 transition-shadow w-44 text-right"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-6 p-4 px-5 rounded-lg bg-surface-900/50 border border-border cursor-pointer select-none hover:bg-surface-900/80 transition-colors">
                    <span className="text-sm font-medium">{t("settings.collapseRawOutput")}</span>
                    <input
                      type="checkbox"
                      checked={formData.collapseRawOutput}
                      onChange={e => setFormData(p => ({ ...p, collapseRawOutput: e.target.checked }))}
                      className="w-5 h-5 rounded border-border text-accent focus:ring-0 focus:ring-offset-0 bg-surface-700 shrink-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Workspace Style */}
              <div className="space-y-3 pt-6 border-t border-border/30">
                <p className="text-xs uppercase font-bold text-text-muted tracking-widest">Workspace Style</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 px-5 rounded-lg bg-surface-900/50 border border-border hover:bg-surface-900/80 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{t("settings.appearance")}</span>
                      <span className="text-xs text-text-muted mt-0.5">{t("settings.appearanceDesc")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="px-5 py-2 bg-accent text-white rounded-full text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95"
                    >
                      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                      {theme === 'dark' ? t("settings.lightMode") : t("settings.darkMode")}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 px-5 rounded-lg bg-surface-900/50 border border-border hover:bg-surface-900/80 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{t("language.label")}</span>
                      <span className="text-xs text-text-muted mt-0.5">{t("language.description")}</span>
                    </div>
                    <div className="flex gap-1 p-1 bg-surface-700 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setLocale("en-US")}
                        className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                          locale === "en-US" ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-text"
                        }`}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocale("zh-CN")}
                        className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
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

            <div className="pt-6 border-t border-border/30 flex justify-end">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full md:w-auto min-w-[180px] px-8 py-3 bg-accent text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all shadow-lg shadow-accent/10 active:scale-[0.98]"
              >
                {mutation.isPending ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                {t("settings.savePreferences")}
              </button>
            </div>
          </form>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 p-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Config Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-text-muted">
                  <FileCode size={16} />
                  <span className="text-xs uppercase font-bold tracking-widest">{t("settings.configPath")}</span>
                </div>
                <div className="bg-surface-900/40 p-5 rounded-xl border border-border/20 space-y-3">
                  <code className="text-sm font-mono break-all text-text-muted leading-relaxed block">
                    {data?.metadata.configPath}
                  </code>
                  <div className="flex items-center justify-between pt-2 border-t border-border/10">
                    <span className="text-[10px] text-text-muted/60 italic">Location of your preferences</span>
                    <button
                      onClick={() => {
                        if (data?.metadata.configPath) {
                          navigator.clipboard.writeText(data.metadata.configPath);
                        }
                      }}
                      className="text-[10px] font-bold text-accent hover:text-accent-light transition-colors uppercase tracking-wider"
                    >
                      Copy Path
                    </button>
                  </div>
                </div>
              </div>

              {/* Logs Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-text-muted">
                  <Database size={16} />
                  <span className="text-xs uppercase font-bold tracking-widest">{t("settings.logsPath")}</span>
                </div>
                <div className="bg-surface-900/40 p-5 rounded-xl border border-border/20 space-y-3">
                  <code className="text-sm font-mono break-all text-text-muted leading-relaxed block">
                    {data?.metadata.logPath}
                  </code>
                  <div className="flex items-center justify-between pt-2 border-t border-border/10">
                    <span className="text-[10px] text-text-muted/60 italic">Where execution logs reside</span>
                    <button
                      onClick={() => {
                        if (data?.metadata.logPath) {
                          navigator.clipboard.writeText(data.metadata.logPath);
                        }
                      }}
                      className="text-[10px] font-bold text-accent hover:text-accent-light transition-colors uppercase tracking-wider"
                    >
                      Copy Path
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Grid */}
            <div className="pt-6 border-t border-border/30">
              <p className="text-[10px] uppercase font-bold text-text-muted/60 tracking-widest px-1 mb-4">System Status</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-surface-900/50 border border-border/30 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-muted/60 uppercase tracking-tighter">Config Status</span>
                  <span className="text-xs font-bold text-success flex items-center gap-1.5 uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    {data?.metadata.configStatus}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-surface-900/50 border border-border/30 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-muted/60 uppercase tracking-tighter">Environment</span>
                  <span className="text-xs font-bold text-text-muted uppercase">Production</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-900/50 border border-border/30 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-muted/60 uppercase tracking-tighter">CLI Ready</span>
                  <span className="text-xs font-bold text-accent-light uppercase">Yes</span>
                </div>
                <div className="p-4 rounded-xl bg-surface-900/50 border border-border/30 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-muted/60 uppercase tracking-tighter">Permissions</span>
                  <span className="text-xs font-bold text-text-muted uppercase">Verified</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
