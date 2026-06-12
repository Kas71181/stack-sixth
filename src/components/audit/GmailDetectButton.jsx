import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle2, Sparkles, X } from "lucide-react";

const CONNECTOR_ID = "6a2c11c93a60aebc9a354fd8";

export default function GmailDetectButton({ onToolsDetected }) {
  const [status, setStatus] = useState("idle"); // idle | connecting | scanning | done | error
  const [detected, setDetected] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [errorMsg, setErrorMsg] = useState("");

  const runScan = async () => {
    setStatus("scanning");
    setErrorMsg("");
    try {
      const res = await base44.functions.invoke("detectToolsFromGmail", {});
      if (res.data?.success) {
        const tools = res.data.tools || [];
        setDetected(tools);
        setSelected(new Set(tools.map((t) => t.name)));
        setStatus("done");
      } else {
        throw new Error(res.data?.error || "Scan failed");
      }
    } catch (err) {
      setErrorMsg(err?.message || "Could not scan Gmail");
      setStatus("error");
    }
  };

  const handleConnect = async () => {
    setStatus("connecting");
    setErrorMsg("");
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      const timer = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          await runScan();
        }
      }, 500);
    } catch (err) {
      setErrorMsg(err?.message || "Connection failed");
      setStatus("error");
    }
  };

  const handleImport = () => {
    const toImport = detected
      .filter((t) => selected.has(t.name))
      .map((t) => ({ name: t.name, category: t.category }));
    onToolsDetected(toImport);
    setStatus("idle");
    setDetected([]);
  };

  const toggleTool = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  if (status === "done" && detected.length > 0) {
    return (
      <div className="bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold">
              {detected.length} tools detected from Gmail
            </p>
          </div>
          <button onClick={() => setStatus("idle")} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Select the tools you want to add to your stack:</p>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {detected.map((tool) => (
            <button
              key={tool.name}
              onClick={() => toggleTool(tool.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selected.has(tool.name)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border/60 text-muted-foreground"
              }`}
            >
              {tool.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setStatus("idle")}>
            Cancel
          </Button>
          <Button size="sm" className="flex-1 gap-1.5" onClick={handleImport} disabled={selected.size === 0}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Add {selected.size} tool{selected.size !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    );
  }

  if (status === "done" && detected.length === 0) {
    return (
      <div className="flex items-center justify-between bg-muted/50 border border-border/60 rounded-xl px-4 py-3">
        <p className="text-xs text-muted-foreground">No recognizable SaaS tools found in recent emails.</p>
        <button onClick={() => setStatus("idle")} className="text-muted-foreground hover:text-foreground ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-2 border-dashed"
        onClick={handleConnect}
        disabled={status === "connecting" || status === "scanning"}
      >
        {status === "connecting" || status === "scanning" ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {status === "connecting" ? "Connecting Gmail…" : "Scanning emails…"}
          </>
        ) : (
          <>
            <Mail className="w-3.5 h-3.5" />
            Auto-detect tools from Gmail
          </>
        )}
      </Button>
      {status === "error" && (
        <p className="text-xs text-destructive px-1">{errorMsg}</p>
      )}
    </div>
  );
}