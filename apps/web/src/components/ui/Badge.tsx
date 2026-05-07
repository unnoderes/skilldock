import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "error" | "warning" | "running" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-border text-foreground border-transparent",
    success: "bg-success/20 text-green-400 border-success/30",
    error: "bg-error/20 text-red-400 border-error/30",
    warning: "bg-warning/20 text-yellow-400 border-warning/30",
    running: "bg-running/20 text-orange-400 border-running/30 animate-pulse",
    outline: "text-foreground border-border bg-transparent",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
