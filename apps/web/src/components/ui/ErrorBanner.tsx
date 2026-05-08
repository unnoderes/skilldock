import React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { useLocale } from "../../contexts/LocaleContext";

export function ErrorBanner({
  message,
  onRetry,
  className = "",
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-4 rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-danger ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <AlertCircle size={18} className="shrink-0" />
        <span className="text-xs font-medium break-words">{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-bold hover:bg-danger/10"
        >
          <span className="inline-flex items-center gap-1.5">
            <RefreshCcw size={14} />
            {t("error.retry")}
          </span>
        </button>
      )}
    </div>
  );
}
