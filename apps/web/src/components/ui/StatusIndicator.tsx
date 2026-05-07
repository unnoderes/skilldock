import * as React from "react";
import { cn } from "../../lib/utils";

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "online" | "offline" | "busy" | "error";
  label?: string;
}

const StatusIndicator = ({
  status,
  label,
  className,
  ...props
}: StatusIndicatorProps) => {
  const colors = {
    online: "bg-green-500",
    offline: "bg-gray-500",
    busy: "bg-yellow-500 animate-pulse",
    error: "bg-red-500",
  };

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className={cn("h-2 w-2 rounded-full", colors[status])} />
      {label && <span className="text-xs font-medium text-foreground/70 uppercase tracking-wider">{label}</span>}
    </div>
  );
};

export { StatusIndicator };
