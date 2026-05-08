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
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Preferences Form */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-accent-light" />
            <h3 className="font-bold tracking-tight uppercase text-xs tracking-widest text-text-muted">{t("settings.userPreferences")}</h3>
          </div>

          <form onSubmit={handleSave} className="p-8 rounded-2xl bg-surface-800 border border-border space-y-6">
            <div className="space-y-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold">{t("settings.defaultSkillsScope")}</span>
                <select
                  value={formData.defaultSkillsScope}
                  onChange={e => setFormData(p => ({ ...p, defaultSkillsScope: e.target.value as Scope }))}
                  className="bg-surface-900 border-border rounded-xl text-sm outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="project">Project (Local)</option>
                  <option value="global">Global (System)</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold">{t("settings.defaultMcpScope")}</span>
                <select
                  value={formData.defaultMcpScope}
                  onChange={e => setFormData(p => ({ ...p, defaultMcpScope: e.target.value as Scope }))}
                  className="bg-surface-900 border-border rounded-xl text-sm outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="project">Project (Local)</option>
                  <option value="global">Global (System)</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold">{t("settings.recentLogsLimit")}</span>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={formData.defaultLogsLimit}
                  onChange={e => setFormData(p => ({ ...p, defaultLogsLimit: Number(e.target.value) }))}
                  className="bg-surface-900 border-border rounded-xl text-sm outline-none focus:ring-1 focus:ring-accent"
                />
              </label>

              <label className="flex items-center gap-3 p-4 rounded-xl bg-surface-900/50 border border-border/50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.collapseRawOutput}
                  onChange={e => setFormData(p => ({ ...p, collapseRawOutput: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-0 focus:ring-offset-0 bg-surface-900"
                />
                <span className="text-sm font-medium">{t("settings.collapseRawOutput")}</span>
              </label>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-900/50 border border-border/50">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">{t("settings.appearance")}</span>
                  <span className="text-xs text-text-muted">{t("settings.appearanceDesc")}</span>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all"
                >
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  {theme === 'dark' ? t("settings.lightMode") : t("settings.darkMode")}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-900/50 border border-border/50">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">{t("language.label")}</span>
                  <span className="text-xs text-text-muted">{t("language.description")}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLocale("en-US")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      locale === "en-US" ? "bg-accent text-white" : "bg-surface-700 text-text-muted hover:text-text"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale("zh-CN")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      locale === "zh-CN" ? "bg-accent text-white" : "bg-surface-700 text-text-muted hover:text-text"
                    }`}
                  >
                    简体中文
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3 bg-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-accent/20"
            >
              {mutation.isPending ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              {t("settings.savePreferences")}
            </button>
          </form>
        </section>

        {/* Metadata section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Database size={20} className="text-warning" />
            <h3 className="font-bold tracking-tight uppercase text-xs tracking-widest text-text-muted">{t("settings.systemContext")}</h3>
          </div>

          <div className="p-8 rounded-2xl bg-surface-800 border border-border space-y-6">
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">{t("settings.configPath")}</p>
                <div className="p-3 rounded-xl bg-surface-900 border border-border/50 flex items-center gap-3">
                  <FileCode size={14} className="text-text-muted shrink-0" />
                  <code className="text-[11px] font-mono break-all text-text-muted">{data?.metadata.configPath}</code>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">{t("settings.logsPath")}</p>
                <div className="p-3 rounded-xl bg-surface-900 border border-border/50 flex items-center gap-3">
                  <FileCode size={14} className="text-text-muted shrink-0" />
                  <code className="text-[11px] font-mono break-all text-text-muted">{data?.metadata.logPath}</code>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">{t("settings.cliCommands")}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-900/50 border border-border/30">
                    <span className="text-xs font-bold text-text-muted">{t("settings.skillsLabel")}</span>
                    <code className="text-xs font-mono">{data?.metadata.cliCommands.skills}</code>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-900/50 border border-border/30">
                    <span className="text-xs font-bold text-text-muted">{t("settings.addMcpLabel")}</span>
                    <code className="text-xs font-mono">{data?.metadata.cliCommands.addMcp}</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
              <p className="text-[11px] leading-relaxed text-accent-light/80 italic">
                {t("settings.securityNotice")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
