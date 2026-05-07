import * as React from "react";
import { Panel } from "../components/ui/Panel";
import { Button } from "../components/ui/Button";
import { Globe, Folder, Layers, Save } from "lucide-react";

const Settings = () => {
  return (
    <div className="max-w-3xl space-y-6">
      <Panel title="Default Scopes">
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <div>
                 <div className="text-sm font-medium">Skills Management Scope</div>
                 <div className="text-xs text-foreground/50 mt-1">Default scope used when listing or installing skills.</div>
              </div>
              <div className="flex items-center gap-2 bg-sidebar border border-border p-1 rounded-md">
                 <Button variant="ghost" size="sm" className="bg-white/5 text-white">
                    <Globe size={14} className="mr-2" /> Global
                 </Button>
                 <Button variant="ghost" size="sm" className="text-foreground/50">
                    <Folder size={14} className="mr-2" /> Project
                 </Button>
              </div>
           </div>

           <div className="flex items-center justify-between border-t border-border/50 pt-6">
              <div>
                 <div className="text-sm font-medium">MCP Configuration Scope</div>
                 <div className="text-xs text-foreground/50 mt-1">Which MCP configuration file to target by default.</div>
              </div>
              <div className="flex items-center gap-2 bg-sidebar border border-border p-1 rounded-md">
                 <Button variant="ghost" size="sm" className="bg-white/5 text-white">
                    <Globe size={14} className="mr-2" /> Global
                 </Button>
                 <Button variant="ghost" size="sm" className="text-foreground/50">
                    <Folder size={14} className="mr-2" /> Project
                 </Button>
              </div>
           </div>
        </div>
      </Panel>

      <Panel title="Display Preferences">
         <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                   <div className="text-sm font-medium">Log Retention Limit</div>
                   <div className="text-xs text-foreground/50 mt-1">Number of recent operations to keep in memory.</div>
                </div>
                <input
                    type="number"
                    defaultValue={50}
                    className="h-9 w-20 rounded-md border border-border bg-sidebar px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-6">
                <div>
                   <div className="text-sm font-medium">Raw Output Behavior</div>
                   <div className="text-xs text-foreground/50 mt-1">Automatically collapse large stdout/stderr blocks.</div>
                </div>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary/20 cursor-pointer">
                    <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-primary transition" />
                </div>
            </div>
         </div>
      </Panel>

      <div className="flex justify-end gap-4">
          <Button variant="ghost">Reset Defaults</Button>
          <Button variant="primary">
             <Save size={16} className="mr-2" /> Save Changes
          </Button>
      </div>

      <div className="pt-10 flex flex-col items-center gap-2 opacity-20">
         <Layers size={32} />
         <div className="text-[10px] font-mono tracking-[0.2em] uppercase">SkillDock Operational Layer</div>
      </div>
    </div>
  );
};

export default Settings;
