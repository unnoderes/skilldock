import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout";
import { Overview } from "./pages/Overview";
import { Skills } from "./pages/Skills";
import { Mcp } from "./pages/Mcp";
import { Logs } from "./pages/Logs";
import { Settings } from "./pages/Settings";
import { useTask } from "./hooks/useTask";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  // Simple hash-based router
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return ["overview", "skills", "mcp", "logs", "settings"].includes(hash) ? hash : "overview";
  });

  useEffect(() => {
    window.location.hash = view;
  }, [view]);

  // Handle browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (["overview", "skills", "mcp", "logs", "settings"].includes(hash)) {
        setView(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const { activeTask, watch, stop, setActiveTask } = useTask();

  const handleTaskStart = (taskId: string, title: string) => {
    watch(taskId, title);
  };

  const renderView = () => {
    switch (view) {
      case "overview": return <Overview />;
      case "skills": return <Skills onTaskStart={handleTaskStart} />;
      case "mcp": return <Mcp onTaskStart={handleTaskStart} />;
      case "logs": return <Logs />;
      case "settings": return <Settings />;
      default: return <Overview />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Layout currentView={view} setView={setView}>
        {renderView()}
      </Layout>
    </QueryClientProvider>
  );
}
