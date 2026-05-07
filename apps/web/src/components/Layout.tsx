import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TaskDrawer } from "./TaskDrawer";
import { useTask } from "../hooks/useTask";

export function Layout({ children, currentView, setView }: { children: React.ReactNode, currentView: string, setView: (v: string) => void }) {
  const { activeTask, stop, setActiveTask } = useTask();
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Expose activeTask to children via some mechanism or just rely on global layout
  // For MVP, we'll pass setters down or use the hook in pages too

  return (
    <div className="flex min-h-screen bg-surface-900 text-text selection:bg-accent selection:text-white">
      <Sidebar currentView={currentView} setView={setView} />

      <main className="flex-1 flex flex-col relative overflow-x-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-surface-900/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold tracking-tight capitalize">{currentView}</h2>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold font-mono">/ {currentView}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Global status or user info would go here */}
          </div>
        </header>

        <div className="flex-1 p-8 pb-32">
          {children}
        </div>

        <TaskDrawer
          activeTask={activeTask}
          onClose={() => { stop(); setActiveTask(null); }}
          isOpen={isDrawerOpen}
          setIsOpen={setIsDrawerOpen}
        />
      </main>
    </div>
  );
}
