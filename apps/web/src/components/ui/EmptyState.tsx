import React from "react";
import { AlertCircle, type LucideIcon } from "lucide-react";

export function EmptyState({
  title,
  message,
  action,
  icon: Icon = AlertCircle,
  className = "",
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-2xl bg-surface-800/30 ${className}`}>
      <div className="p-3 rounded-full bg-surface-800 border border-border mb-4 text-text-muted">
        <Icon size={24} />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-text-muted max-w-xs mb-6">{message}</p>
      {action}
    </div>
  );
}
