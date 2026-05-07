import * as React from "react";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Search, Plus, RefreshCw, Trash2, Globe, Folder } from "lucide-react";

const Skills = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-panel border border-border p-1 rounded-md">
           <Button variant="ghost" size="sm" className="bg-white/5 text-white">
             <Globe size={14} className="mr-2" /> Global
           </Button>
           <Button variant="ghost" size="sm" className="text-foreground/50">
             <Folder size={14} className="mr-2" /> Project
           </Button>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                    type="text"
                    placeholder="Filter skills..."
                    className="h-9 w-64 rounded-md border border-border bg-sidebar pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
            <Button variant="primary" size="sm">
                <Plus size={16} className="mr-1" /> Install Skill
            </Button>
        </div>
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/50 text-foreground/40 uppercase text-[10px] font-bold tracking-widest">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[
                { name: "claude-code", version: "0.2.14", path: "~/.nvm/versions/node/v20.12.2/bin/claude" },
                { name: "@skilldock/cli", version: "1.2.4", path: "/usr/local/bin/skills" },
                { name: "mcp-server-git", version: "0.1.0", path: "npm:@modelcontextprotocol/server-git" },
              ].map((skill) => (
                <tr key={skill.name} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4 font-medium">{skill.name}</td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className="font-mono">{skill.version}</Badge>
                  </td>
                  <td className="px-4 py-4 text-foreground/40 font-mono text-xs truncate max-w-xs">{skill.path}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" className="h-8 w-8">
                          <RefreshCw size={14} />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-error/50 hover:text-error hover:bg-error/10">
                          <Trash2 size={14} />
                       </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

export default Skills;
