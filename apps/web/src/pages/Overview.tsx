import React from "react";
import { Server, Activity, Terminal, CheckCircle2, XCircle, History } from "lucide-react";
import { useStatus } from "../hooks/useStatus";
import { useLogs } from "../hooks/useLogs";
import { useLocale } from "../contexts/LocaleContext";

export function Overview() {
  const { data: status, isLoading: isStatusLoading } = useStatus();
  const { data: logsData, isLoading: isLogsLoading } = useLogs(5);
  const { t } = useLocale();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Environment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <section className="p-6 rounded-2xl bg-surface-800 border border-border flex flex-col gap-4">
          <div className="flex items-center gap-3 text-accent-light">
            <Server size={20} />
            <h3 className="font-bold tracking-tight">{t("overview.cliHealth")}</h3>
          </div>
          <div className="space-y-3">
            {isStatusLoading ? (
              <div className="h-20 animate-pulse bg-surface-700 rounded-xl" />
            ) : (
              status?.cli.map((cli) => (
                <div key={cli.name} className="flex items-center justify-between p-3 rounded-xl bg-surface-900 border border-border/50">
                  <span className="font-medium text-sm capitalize">{cli.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-text-muted">{cli.available ? cli.version : "N/A"}</span>
                    {cli.available ? (
                      <CheckCircle2 size={16} className="text-success" />
                    ) : (
                      <XCircle size={16} className="text-danger" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="p-6 rounded-2xl bg-surface-800 border border-border flex flex-col gap-4">
          <div className="flex items-center gap-3 text-success">
            <Activity size={20} />
            <h3 className="font-bold tracking-tight">{t("overview.systemStatus")}</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center gap-2 p-4 rounded-xl bg-surface-900/50 border border-border/30 border-dashed">
            {isStatusLoading ? (
              <span className="text-xs text-text-muted">{t("overview.analyzing")}</span>
            ) : (
              <>
                <span className="text-3xl font-bold font-mono tracking-tighter">OK</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
                  Server Time: {new Date(status?.serverTime ?? Date.now()).toLocaleTimeString()}
                </span>
              </>
            )}
          </div>
        </section>

        <section className="p-6 rounded-2xl bg-surface-800 border border-border flex flex-col gap-4">
          <div className="flex items-center gap-3 text-warning">
            <Terminal size={20} />
            <h3 className="font-bold tracking-tight">{t("overview.projectContext")}</h3>
          </div>
          <div className="p-4 rounded-xl bg-surface-900 border border-border/50 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">{t("overview.path")}</span>
              <span className="font-mono truncate ml-4">/var/tmp/skilldock/...</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">{t("overview.runtime")}</span>
              <span className="font-mono">Node {status?.cli[0]?.version?.split(' ')[0] ?? '...'}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Recent Activity */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <History size={20} className="text-text-muted" />
          <h3 className="font-bold tracking-tight">{t("overview.recentActivity")}</h3>
        </div>

        <div className="rounded-2xl border border-border bg-surface-800 overflow-hidden">
          {isLogsLoading ? (
            <div className="p-12 flex justify-center"><Activity className="animate-spin text-text-muted" /></div>
          ) : !logsData?.logs.length ? (
            <div className="p-12 text-center text-text-muted text-sm italic">{t("overview.noRecentOperations")}</div>
          ) : (
            <div className="divide-y divide-border">
              {logsData.logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-surface-700/50 transition-colors flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${log.result.exitCode === 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                      <Terminal size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate tracking-tight">{log.source}</p>
                      <p className="text-[10px] font-mono text-text-muted truncate">
                        {log.result.command} {log.result.args.join(" ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0 font-mono text-[11px] text-text-muted">
                    <span>{log.result.durationMs}ms</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

