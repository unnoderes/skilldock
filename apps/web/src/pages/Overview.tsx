import * as React from "react";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Activity, Shield, Terminal, Zap } from "lucide-react";

const Overview = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Panel className="border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Terminal size={20} className="text-primary" />
            </div>
            <div>
              <div className="text-xs text-foreground/50 uppercase font-bold tracking-widest">CLI Status</div>
              <div className="text-xl font-bold">Connected</div>
            </div>
          </div>
        </Panel>

        <Panel className="border-l-4 border-l-success">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-success/10 rounded-lg">
                <Zap size={20} className="text-success" />
            </div>
            <div>
              <div className="text-xs text-foreground/50 uppercase font-bold tracking-widest">Active Tasks</div>
              <div className="text-xl font-bold">0</div>
            </div>
          </div>
        </Panel>

        <Panel className="border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
                <Activity size={20} className="text-warning" />
            </div>
            <div>
              <div className="text-xs text-foreground/50 uppercase font-bold tracking-widest">Logs (24h)</div>
              <div className="text-xl font-bold">12</div>
            </div>
          </div>
        </Panel>

        <Panel className="border-l-4 border-l-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-border/20 rounded-lg">
                <Shield size={20} className="text-foreground/50" />
            </div>
            <div>
              <div className="text-xs text-foreground/50 uppercase font-bold tracking-widest">Security</div>
              <div className="text-xl font-bold">Strict</div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Recent Activity" className="lg:col-span-2">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                    <div className="font-mono text-xs text-foreground/30">14:2{i}:45</div>
                    <div>
                        <div className="text-sm font-medium">skills list --scope global</div>
                        <div className="text-[10px] text-foreground/40 font-mono">ID: task_a7f{i}d</div>
                    </div>
                </div>
                <Badge variant="success">Completed</Badge>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full text-foreground/50">View all logs</Button>
          </div>
        </Panel>

        <Panel title="Environment">
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/50">Node.js</span>
              <span className="font-mono">v20.12.2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/50">Operating System</span>
              <span className="font-mono text-right truncate max-w-[150px]">Linux 6.6.87.2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/50">CLI Version</span>
              <span className="font-mono">v1.2.4</span>
            </div>
             <div className="pt-4 border-t border-border">
               <Button size="sm" variant="secondary" className="w-full">System Check</Button>
             </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default Overview;
