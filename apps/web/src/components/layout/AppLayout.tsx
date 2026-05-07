import * as React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Badge } from "../ui/Badge";

export const AppLayout = () => {
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Overview";
    const name = path.split("/")[1];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold tracking-wide text-foreground/90 uppercase">
              {getTitle()}
            </h1>
            <Badge variant="outline" className="text-[10px] py-0 h-5 border-border/50 text-foreground/40 font-mono uppercase">
              Project: skilldock-web
            </Badge>
          </div>

          <div className="flex items-center gap-4">
             {/* Global Task Indicator Placeholder */}
             <div className="flex items-center gap-2 text-xs text-foreground/50">
                <span className="h-2 w-2 rounded-full bg-border" />
                <span>Idle</span>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-background">
          <div className="mx-auto max-w-7xl px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
