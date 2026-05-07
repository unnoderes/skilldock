import * as React from "react";
import { Panel } from "../components/ui/Panel";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Terminal, Clock, ChevronRight } from "lucide-react";

const Logs = () => {
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6">
      <div className="flex-1 overflow-hidden flex gap-6">
        <Panel title="Operation History" className="w-1/3 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="group cursor-pointer border-b border-border/50 p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                        <Badge variant={i === 1 ? "running" : "default"} className="text-[9px]">
                            {i === 1 ? "Running" : "Completed"}
                        </Badge>
                        <span className="text-[10px] text-foreground/30 font-mono">2026-05-07 09:2{i}:12</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate pr-4">skills install @lucide/react</span>
                        <ChevronRight size={14} className="text-foreground/20 group-hover:text-foreground/50 transition-colors" />
                    </div>
                </div>
             ))}
          </div>
        </Panel>

        <div className="flex-1 flex flex-col gap-6">
            <Panel title="Log Details" className="flex-1 flex flex-col p-0 overflow-hidden">
                <div className="p-4 border-b border-border/50 bg-sidebar/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-foreground/50">
                            <Terminal size={12} />
                            <span className="font-mono">ID: task_9b2e1</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-foreground/50">
                            <Clock size={12} />
                            <span className="font-mono">Duration: 1.2s</span>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-[10px]">RETRY COMMAND</Button>
                </div>
                <div className="flex-1 bg-sidebar p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
                    <div className="text-foreground/40 mb-2">$ skills install @lucide/react --scope global</div>
                    <div className="text-foreground/80 leading-relaxed whitespace-pre">
{`Resolving packages...
Fetching @lucide/react@latest...
Installing dependencies...
+ @lucide/react@0.378.0
Added 1 package to global skills.
Execution completed with exit code 0.`}
                    </div>
                </div>
            </Panel>
        </div>
      </div>
    </div>
  );
};

export default Logs;
