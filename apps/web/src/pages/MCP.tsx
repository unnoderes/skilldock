import * as React from "react";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Plus, Server, Shield, Cpu } from "lucide-react";

const MCP = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-foreground/50 text-sm">
                <Cpu size={16} />
                <span>Available Agents: <strong>4</strong></span>
             </div>
        </div>
        <Button variant="primary" size="sm">
            <Plus size={16} className="mr-1" /> Add MCP Server
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Configured Servers">
           <div className="space-y-4">
              {[
                { name: "sqlite", status: "active", type: "stdio" },
                { name: "github", status: "active", type: "stdio" },
                { name: "brave-search", status: "error", type: "stdio" },
              ].map((server) => (
                <div key={server.name} className="flex items-center justify-between p-3 rounded-md bg-sidebar border border-border/50">
                    <div className="flex items-center gap-3">
                        <Server size={16} className={server.status === "active" ? "text-success" : "text-error"} />
                        <div>
                            <div className="text-sm font-medium">{server.name}</div>
                            <div className="text-[10px] text-foreground/40 font-mono">TYPE: {server.type}</div>
                        </div>
                    </div>
                    <Badge variant={server.status === "active" ? "success" : "error"}>
                        {server.status}
                    </Badge>
                </div>
              ))}
           </div>
        </Panel>

        <Panel title="Security Boundary">
            <div className="space-y-4 text-sm text-foreground/70">
                <div className="flex items-start gap-3 p-3 rounded-md bg-primary/5 border border-primary/20">
                    <Shield size={18} className="text-primary mt-0.5 shrink-0" />
                    <div>
                        <div className="font-semibold text-primary">Read-Only Safety</div>
                        <p className="text-xs mt-1 leading-relaxed">
                            MCP server configuration is managed via controlled CLI calls.
                            SkillDock does not directly modify your local config files.
                        </p>
                    </div>
                </div>
                <div className="text-[10px] font-mono text-foreground/40 mt-4 uppercase">
                    Config Path: ~/.config/Claude/config.json
                </div>
            </div>
        </Panel>
      </div>

      <Panel title="Raw MCP Output (Global)">
        <pre className="bg-sidebar rounded-md p-4 text-xs text-green-500/80 font-mono leading-relaxed overflow-x-auto">
{`{
  "mcpServers": {
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "/Users/dev/test.db"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "********"
      }
    }
  }
}`}
        </pre>
      </Panel>
    </div>
  );
};

export default MCP;
