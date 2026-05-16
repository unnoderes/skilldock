import React, { useEffect, useMemo, useState } from "react";
import { History, Terminal, Clock, Calendar, AlertTriangle, Trash2 } from "lucide-react";
import type { OperationLogEntry } from "@skilldock/shared";
import { SearchInput } from "../components/ui/SearchInput";
import { Pagination } from "../components/ui/Pagination";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useClearLogs, useLogs } from "../hooks/useLogs";
import { useLocale } from "../contexts/LocaleContext";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function readPositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readLogsQueryState() {
  const params = new URLSearchParams(window.location.search);
  const pageSize = readPositiveInt(params.get("logsPageSize"), DEFAULT_PAGE_SIZE);
  return {
    page: readPositiveInt(params.get("logsPage"), DEFAULT_PAGE),
    pageSize: PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
    search: params.get("logsQ") ?? "",
  };
}

export function Logs() {
  const initialQuery = useMemo(readLogsQueryState, []);
  const [page, setPage] = useState(initialQuery.page);
  const [pageSize, setPageSize] = useState(initialQuery.pageSize);
  const [search, setSearch] = useState(initialQuery.search);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [clearFeedback, setClearFeedback] = useState<"success" | "error" | null>(null);
  const { data, isLoading, error, refetch } = useLogs({ page, pageSize, q: search });
  const clearLogs = useClearLogs();
  const { t } = useLocale();

  const logs: OperationLogEntry[] = data?.logs ?? [];
  const pagination = data?.pagination;
  const hasLogs = (pagination?.totalItems ?? logs.length) > 0;
  const clearDisabled = isLoading || clearLogs.isPending || !hasLogs;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (page === DEFAULT_PAGE) {
      params.delete("logsPage");
    } else {
      params.set("logsPage", String(page));
    }
    if (pageSize === DEFAULT_PAGE_SIZE) {
      params.delete("logsPageSize");
    } else {
      params.set("logsPageSize", String(pageSize));
    }
    if (search.trim()) {
      params.set("logsQ", search.trim());
    } else {
      params.delete("logsQ");
    }

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [page, pageSize, search]);

  useEffect(() => {
    if (pagination && pagination.page !== page) {
      setPage(pagination.page);
    }
  }, [page, pagination]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(DEFAULT_PAGE);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(DEFAULT_PAGE);
  };

  const handleClearLogs = () => {
    setClearFeedback(null);
    setIsClearDialogOpen(false);
    clearLogs.mutate(undefined, {
      onSuccess: () => {
        setPage(DEFAULT_PAGE);
        setClearFeedback("success");
        void refetch();
      },
      onError: () => {
        setClearFeedback("error");
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface-800 p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-6">
          <SearchInput
            placeholder={t("logs.searchPlaceholder")}
            value={search}
            onChange={handleSearchChange}
            className="w-80"
          />

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest whitespace-nowrap">{t("logs.show")}</span>
            <select
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              className="py-1 px-3 text-xs bg-surface-900 border-border rounded-lg outline-none focus:ring-1 focus:ring-accent"
            >
              <option value={10}>10 {t("logs.records")}</option>
              <option value={20}>20 {t("logs.records")}</option>
              <option value={50}>50 {t("logs.records")}</option>
              <option value={100}>100 {t("logs.records")}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void refetch()}
            className="px-4 py-2 text-xs font-bold border border-border rounded-xl hover:bg-surface-700 transition-colors flex items-center gap-2"
          >
            <History size={14} />
            {t("logs.refreshHistory")}
          </button>
          <button
            onClick={() => {
              setClearFeedback(null);
              setIsClearDialogOpen(true);
            }}
            disabled={clearDisabled}
            title={!hasLogs ? t("logs.clearDisabled") : undefined}
            className="px-4 py-2 text-xs font-bold border border-danger/40 text-danger rounded-xl hover:bg-danger/10 disabled:hover:bg-transparent transition-colors flex items-center gap-2"
          >
            <Trash2 size={14} />
            {clearLogs.isPending ? t("logs.clearingHistory") : t("logs.clearHistory")}
          </button>
        </div>
      </header>

      {clearFeedback && (
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
          clearFeedback === "success"
            ? "bg-success/10 border-success/30 text-success"
            : "bg-danger/10 border-danger/30 text-danger"
        }`}>
          <AlertTriangle size={16} />
          <span>{clearFeedback === "success" ? t("logs.clearSuccess") : t("logs.clearFailed")}</span>
        </div>
      )}

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
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-text-muted border border-dashed border-border rounded-2xl">
            {t("logs.noMatchingEntries")}
          </div>
        ) : (
          logs.map((log) => (
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

      {pagination && (
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          labels={{
            first: t("logs.pagination.first"),
            previous: t("logs.pagination.previous"),
            next: t("logs.pagination.next"),
            last: t("logs.pagination.last"),
            jumpTo: t("logs.pagination.jumpTo"),
            go: t("logs.pagination.go"),
            page: t("logs.pagination.page"),
            of: t("logs.pagination.of"),
            total: t("logs.pagination.total"),
            showing: t("logs.pagination.showing"),
            to: t("logs.pagination.to"),
            items: t("logs.pagination.items"),
          }}
        />
      )}

      <ConfirmDialog
        isOpen={isClearDialogOpen}
        title={t("logs.clearConfirmTitle")}
        message={[
          t("logs.clearConfirmMessage"),
          t("logs.clearConfirmSafety"),
        ]}
        confirmLabel={t("logs.clearConfirmButton")}
        onConfirm={handleClearLogs}
        onCancel={() => setIsClearDialogOpen(false)}
        isDangerous
      />
    </div>
  );
}
