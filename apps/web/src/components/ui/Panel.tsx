import * as React from "react";
import { cn } from "../../lib/utils";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  headerAction?: React.ReactNode;
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, title, headerAction, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-border bg-panel text-foreground shadow-sm",
          className
        )}
        {...props}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold leading-none tracking-tight">
              {title}
            </h3>
            {headerAction && (
              <div className="flex items-center space-x-2">{headerAction}</div>
            )}
          </div>
        )}
        <div className={cn("p-4", !title && "p-4")}>{children}</div>
      </div>
    );
  }
);
Panel.displayName = "Panel";

export { Panel };
