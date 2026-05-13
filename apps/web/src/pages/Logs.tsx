import React, { useState } from "react";
import { History, Terminal, Clock, Calendar, AlertTriangle } from "lucide-react";
import { SearchInput } from "../components/ui/SearchInput";
import { useLogs } from "../hooks/useLogs";
import { useLocale } from "../contexts/LocaleContext";

export function Logs() {
  const [limit, setLimit] = useState(50);
  const { data, isLoading, error, refetch } = useLogs(limit);
  const [search, setSearch] = useState("");
  const { t } = useLocale();

  const filteredLogs = data?.logs.filter(log =>
    log.source.toLowerCase().includes(search.toLowerCase()) ||
    log.result.command.toLowerCase().includes(search.toLowerCase()) ||
    log.result.args.join(" ").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface-800 p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-6">
          <SearchInput
            placeholder={t("logs.searchPlaceholder")}
            value={search}
            onChange={setSearch}
            className="w-80"
          />

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest whitespace-nowrap">{t("logs.show")}</span>
            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="py-1 px-3 text-xs bg-surface-900 border-border rounded-lg outline-none focus:ring-1 focus:ring-accent"
            >
              <option value={10}>10 {t("logs.records")}</option>
              <option value={20}>20 {t("logs.records")}</option>
              <option value={50}>50 {t("logs.records")}</option>
              <option value={100}>100 {t("logs.records")}</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => void refetch()}
          className="px-4 py-2 text-xs font-bold border border-border rounded-xl hover:bg-surface-700 transition-colors flex items-center gap-2"
        >
          <History size={14} />
          {t("logs.refreshHistory")}
        </button>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-3">
          <AlertTriangle size={16} />
          <span>{t("logs.loadFailed")}</span>
        </div>
      )}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-surface-800 border border-border animate-pulse" />
          ))
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-text-muted border border-dashed border-border rounded-2xl">
            {t("logs.noMatchingEntries")}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <article key={log.id} className="rounded-2xl border border-border bg-surface-800 overflow-hidden transition-all hover:border-accent/30">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-6 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${log.result.exitCode === 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                    <Terminal size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold tracking-tight truncate">{log.source}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        log.result.exitCode === 0 ? "border-success/20 text-success bg-success/5" : "border-danger/20 text-danger bg-danger/5"
                      }`}>
                        EXIT {log.result.exitCode}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-text-muted truncate">
                      {log.project && (
                        <span className="text-accent-light">{log.project.projectName} · </span>
                      )}
                      {log.result.command} {log.result.args.join(" ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8 shrink-0">
                  <div className="hidden md:flex items-center gap-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">
                    <div className="flex items-center gap-2">
                      <Clock size={12} />
                      <span>{log.result.durationMs}ms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={12} />
                      <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-log full detail cards are intentionally hidden for the current UI. */}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
