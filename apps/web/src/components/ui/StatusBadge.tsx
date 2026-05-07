import React from "react";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    queued: "bg-surface-800 text-warning border-warning/30",
    running: "bg-surface-800 text-accent-light border-accent-light/30",
    succeeded: "bg-surface-800 text-success border-success/30",
    failed: "bg-surface-800 text-danger border-danger/30",
  };

  return (
    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium border uppercase tracking-wider ${styles[status] || "bg-surface-800 text-text-muted border-border"}`}>
      {status}
    </span>
  );
}
