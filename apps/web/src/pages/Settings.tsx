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
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 px-1 border-b border-border pb-4">
        <SettingsIcon size={20} className="text-accent" />
        <h2 className="text-xl font-bold tracking-tight">{t("nav.settings")}</h2>
      </div>

      <div className="flex flex-col gap-8">
        {/* User Preferences Section */}
        <section className="bg-surface-800 border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-surface-900/50 flex items-center gap-3">
            <ShieldCheck size={18} className="text-accent-light" />
            <h3 className="font-bold uppercase text-xs tracking-widest text-text-muted">{t("settings.userPreferences")}</h3>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* Left Column: Defaults & Display */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="text-[10px] uppercase font-bold text-text-muted/60 tracking-widest px-1">Default Scopes</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-semibold">{t("settings.defaultSkillsScope")}</span>
                      <select
                        value={formData.defaultSkillsScope}
                        onChange={e => setFormData(p => ({ ...p, defaultSkillsScope: e.target.value as Scope }))}
                        className="bg-surface-900 border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent py-2 px-3 transition-shadow"
                      >
                        <option value="project">Project</option>
                        <option value="global">Global</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-semibold">{t("settings.defaultMcpScope")}</span>
                      <select
                        value={formData.defaultMcpScope}
                        onChange={e => setFormData(p => ({ ...p, defaultMcpScope: e.target.value as Scope }))}
                        className="bg-surface-900 border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent py-2 px-3 transition-shadow"
                      >
                        <option value="project">Project</option>
                        <option value="global">Global</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/30">
                  <p className="text-[10px] uppercase font-bold text-text-muted/60 tracking-widest px-1">Display & Logs</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-semibold">{t("settings.recentLogsLimit")}</span>
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={formData.defaultLogsLimit}
                        onChange={e => setFormData(p => ({ ...p, defaultLogsLimit: Number(e.target.value) }))}
                        className="bg-surface-900 border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent py-2 px-3 transition-shadow"
                      />
                    </label>

                    <label className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-900/50 border border-border/40 cursor-pointer select-none transition-all hover:bg-surface-900 hover:border-border/60 h-[38px]">
                      <input
                        type="checkbox"
                        checked={formData.collapseRawOutput}
                        onChange={e => setFormData(p => ({ ...p, collapseRawOutput: e.target.checked }))}
                        className="w-4 h-4 rounded border-border text-accent focus:ring-0 focus:ring-offset-0 bg-surface-900"
                      />
                      <span className="text-xs font-medium">{t("settings.collapseRawOutput")}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Workspace Style */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="text-[10px] uppercase font-bold text-text-muted/60 tracking-widest px-1">Workspace Style</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-900/50 border border-border/40">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{t("settings.appearance")}</span>
                        <span className="text-[10px] text-text-muted">{t("settings.appearanceDesc")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="px-4 py-1.5 bg-accent text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95"
                      >
                        {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                        {theme === 'dark' ? t("settings.lightMode") : t("settings.darkMode")}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-900/50 border border-border/40">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{t("language.label")}</span>
                        <span className="text-[10px] text-text-muted">{t("language.description")}</span>
                      </div>
                      <div className="flex gap-1 p-1 bg-surface-700 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setLocale("en-US")}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                            locale === "en-US" ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-text"
                          }`}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocale("zh-CN")}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
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

            <div className="pt-6 border-t border-border/30 flex justify-end">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full md:w-auto min-w-[160px] px-8 py-3 bg-accent text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all shadow-md shadow-accent/10 active:scale-[0.98]"
              >
                {mutation.isPending ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                {t("settings.savePreferences")}
              </button>
            </div>
          </form>
        </section>

        {/* System Context Section */}
        <section className="bg-surface-800 border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-surface-900/50 flex items-center gap-3">
            <Database size={18} className="text-warning" />
            <h3 className="font-bold uppercase text-xs tracking-widest text-text-muted">{t("settings.systemContext")}</h3>
          </div>

          <div className="p-0">
            <div className="divide-y divide-border/40">
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-baseline px-6 py-4 gap-2 md:gap-4">
                <span className="text-[10px] uppercase font-bold text-text-muted/70 tracking-widest">{t("settings.configPath")}</span>
                <div className="relative group">
                  <code className="text-xs font-mono break-all text-text-muted selection:bg-accent/30 leading-relaxed block bg-surface-900/40 p-2 rounded-md border border-border/20">
                    {data?.metadata.configPath}
                  </code>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-baseline px-6 py-4 gap-2 md:gap-4">
                <span className="text-[10px] uppercase font-bold text-text-muted/70 tracking-widest">{t("settings.logsPath")}</span>
                <div className="relative group">
                  <code className="text-xs font-mono break-all text-text-muted selection:bg-accent/30 leading-relaxed block bg-surface-900/40 p-2 rounded-md border border-border/20">
                    {data?.metadata.logPath}
                  </code>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center px-6 py-4 gap-2 md:gap-4">
                <span className="text-[10px] uppercase font-bold text-text-muted/70 tracking-widest">{t("settings.cliCommands")}</span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4 p-2 rounded-lg bg-surface-900/50 border border-border/20">
                    <span className="text-[10px] font-bold text-text-muted/60 px-1">{t("settings.skillsLabel")}</span>
                    <code className="text-[11px] font-mono text-accent-light/90">{data?.metadata.cliCommands.skills}</code>
                  </div>
                  <div className="flex items-center justify-between gap-4 p-2 rounded-lg bg-surface-900/50 border border-border/20">
                    <span className="text-[10px] font-bold text-text-muted/60 px-1">{t("settings.addMcpLabel")}</span>
                    <code className="text-[11px] font-mono text-accent-light/90">{data?.metadata.cliCommands.addMcp}</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 border-t border-border/40 bg-surface-900/20">
              <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 max-w-2xl mx-auto">
                <p className="text-[10px] leading-relaxed text-accent-light/70 italic text-center">
                  {t("settings.securityNotice")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
