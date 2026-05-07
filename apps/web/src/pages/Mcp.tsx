import React, { useState } from "react";
import { Zap, Plus, LayoutGrid, List, AlertTriangle } from "lucide-react";
import type { Scope } from "@skilldock/shared";
import { useMcpList, useMcpAgents, useMcpAdd } from "../hooks/useMcp";
import { ScopeToggle } from "../components/ui/ScopeToggle";
import { EmptyState } from "../components/ui/EmptyState";
import { ResultPanel } from "../components/ui/ResultPanel";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

export function Mcp({ onTaskStart }: { onTaskStart: (tid: string, title: string) => void }) {
  const [scope, setScope] = useState<Scope>("project");
  const { data: mcpListData, isLoading: isListLoading } = useMcpList(scope);
  const { data: agentsData, isLoading: isAgentsLoading } = useMcpAgents();
  const addMutation = useMcpAdd();

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string[];
    onConfirm: () => void;
  } | null>(null);

  // Form states
  const [target, setTarget] = useState("");
  const [name, setName] = useState("");

  const handleAddMcp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;

    setConfirmState({
      isOpen: true,
      title: "Add MCP Server",
      message: [
        `You are about to add MCP server: ${target}`,
        name ? `Name: ${name}` : "Name will be auto-generated",
        `Scope: ${scope}`
      ],
      onConfirm: async () => {
        const res = await addMutation.mutateAsync({
          target,
          name: name || undefined,
          scope,
        });
        onTaskStart(res.taskId, `Adding MCP ${target}`);
        setTarget("");
        setName("");
        setConfirmState(null);
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {addMutation.error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-3">
          <AlertTriangle size={16} />
          <span>{addMutation.error instanceof Error ? addMutation.error.message : "Operation failed. Please try again."}</span>
        </div>
      )}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <ScopeToggle label="Scope" value={scope} onChange={setScope} />

        <form onSubmit={handleAddMcp} className="flex gap-2">
          <input
            type="text"
            placeholder="NPM package or URL"
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="text-xs py-1.5 w-64 bg-surface-800 border-border rounded-lg"
          />
          <input
            type="text"
            placeholder="Custom name (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="text-xs py-1.5 w-40 bg-surface-800 border-border rounded-lg"
          />
          <button
            type="submit"
            disabled={!target.trim() || addMutation.isPending}
            className="px-4 py-1.5 bg-accent text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={14} />
            Add Server
          </button>
        </form>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* MCP List Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <List size={20} className="text-accent-light" />
            <h3 className="font-bold tracking-tight uppercase text-xs tracking-widest text-text-muted">Configured Servers</h3>
          </div>

          {isListLoading ? (
            <div className="h-64 rounded-2xl bg-surface-800 border border-border animate-pulse" />
          ) : mcpListData ? (
            <ResultPanel
              title={`MCP Config (${scope})`}
              result={mcpListData}
              compact
              collapseRawOutput={false}
            />
          ) : (
            <EmptyState title="No MCP Config" message="Unable to fetch MCP list for this scope." />
          )}
        </section>

        {/* Agents Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <LayoutGrid size={20} className="text-warning" />
            <h3 className="font-bold tracking-tight uppercase text-xs tracking-widest text-text-muted">Available Agents</h3>
          </div>

          {isAgentsLoading ? (
            <div className="h-64 rounded-2xl bg-surface-800 border border-border animate-pulse" />
          ) : agentsData ? (
            <ResultPanel
              title="Agent Registry"
              result={agentsData}
              compact
              collapseRawOutput={false}
            />
          ) : (
            <EmptyState title="No Agents Found" message="Could not retrieve the agent list from the server." />
          )}
        </section>
      </div>

      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
