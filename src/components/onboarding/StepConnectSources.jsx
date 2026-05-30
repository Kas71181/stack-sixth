import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Loader2, AlertCircle, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SOURCE_CARDS = [
  {
    id: "stripe",
    name: "Stripe",
    logo: "https://logo.clearbit.com/stripe.com",
    description: "Auto-import all active SaaS subscriptions from your Stripe billing account.",
    field: "stripeKey",
    placeholder: "sk_live_... or sk_test_...",
    type: "password",
    learnMore: "https://dashboard.stripe.com/apikeys",
  },
  {
    id: "google",
    name: "Google Workspace",
    logo: "https://logo.clearbit.com/workspace.google.com",
    description: "Pull user counts, seat usage, and activity data from your Google Workspace admin.",
    fields: [
      { key: "gwDomain", placeholder: "yourdomain.com", label: "Domain" },
      { key: "gwAdminEmail", placeholder: "admin@yourdomain.com", label: "Admin Email" },
      { key: "gwServiceKey", placeholder: "Paste service account JSON key", label: "Service Key (JSON)", type: "password" },
    ],
  },
];

export default function StepConnectSources({ company, onToolsImported, existingTools }) {
  const [creds, setCreds] = useState({ stripeKey: "", gwDomain: "", gwAdminEmail: "", gwServiceKey: "" });
  const [status, setStatus] = useState({}); // { stripe: "loading"|"done"|"error", google: ... }
  const [messages, setMessages] = useState({});
  const [expanded, setExpanded] = useState({ stripe: true, google: false, csv: false });
  const [csvFile, setCsvFile] = useState(null);

  const setField = (key, val) => setCreds((c) => ({ ...c, [key]: val }));
  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const connectStripe = async () => {
    if (!creds.stripeKey.trim()) return;
    setStatus((s) => ({ ...s, stripe: "loading" }));
    try {
      const res = await base44.functions.invoke("getStripeSubscriptions", { stripe_key: creds.stripeKey });
      const tools = (res.data?.subscriptions || []).map((sub) => ({
        tool_name: sub.name || sub.product_name || "Unknown",
        category: sub.category || "Other",
        monthly_cost: sub.monthly_cost || sub.amount,
        licensed_seats: sub.quantity || 1,
        active_users: sub.quantity || 1,
        connection_status: "Connected",
        source: "stripe",
      }));
      mergeTools(tools);
      setStatus((s) => ({ ...s, stripe: "done" }));
      setMessages((m) => ({ ...m, stripe: `✓ Imported ${tools.length} subscriptions` }));
    } catch (e) {
      setStatus((s) => ({ ...s, stripe: "error" }));
      setMessages((m) => ({ ...m, stripe: e.message || "Connection failed" }));
    }
  };

  const connectGoogle = async () => {
    if (!creds.gwDomain || !creds.gwAdminEmail || !creds.gwServiceKey) return;
    setStatus((s) => ({ ...s, google: "loading" }));
    try {
      const res = await base44.functions.invoke("getWorkspaceUsers", {
        domain: creds.gwDomain,
        admin_email: creds.gwAdminEmail,
        service_account_key: creds.gwServiceKey,
      });
      const users = res.data?.users || [];
      const tool = {
        tool_name: "Google Workspace",
        category: "Productivity & Docs",
        monthly_cost: users.length * 12,
        licensed_seats: users.length,
        active_users: users.filter((u) => u.status === "Active").length,
        connection_status: "Connected",
        source: "google",
      };
      mergeTools([tool]);
      setStatus((s) => ({ ...s, google: "done" }));
      setMessages((m) => ({ ...m, google: `✓ Found ${users.length} Workspace users` }));
    } catch (e) {
      setStatus((s) => ({ ...s, google: "error" }));
      setMessages((m) => ({ ...m, google: e.message || "Connection failed" }));
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setStatus((s) => ({ ...s, csv: "loading" }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: csvFile });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            tools: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tool_name: { type: "string" },
                  category: { type: "string" },
                  monthly_cost: { type: "number" },
                  licensed_seats: { type: "number" },
                  active_users: { type: "number" },
                },
              },
            },
          },
        },
      });
      const tools = (result.output?.tools || result.output || []).map((t) => ({
        ...t,
        connection_status: "Manual Upload",
        source: "csv",
      }));
      mergeTools(tools);
      setStatus((s) => ({ ...s, csv: "done" }));
      setMessages((m) => ({ ...m, csv: `✓ Imported ${tools.length} tools from CSV` }));
    } catch (e) {
      setStatus((s) => ({ ...s, csv: "error" }));
      setMessages((m) => ({ ...m, csv: "CSV parsing failed. Please check the format." }));
    }
  };

  const mergeTools = (newTools) => {
    const merged = [...existingTools];
    newTools.forEach((t) => {
      const idx = merged.findIndex((m) => m.tool_name?.toLowerCase() === t.tool_name?.toLowerCase());
      if (idx >= 0) merged[idx] = { ...merged[idx], ...t };
      else merged.push(t);
    });
    onToolsImported(merged);
  };

  const totalImported = existingTools.length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Connect your billing and directory sources to auto-import your entire SaaS stack — no manual entry needed.</p>
      {totalImported > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-emerald-700 font-medium">
          {totalImported} tools imported so far — keep connecting to get more!
        </div>
      )}

      {/* Stripe */}
      <div className="border border-border/60 rounded-xl overflow-hidden">
        <button onClick={() => toggle("stripe")} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <img src="https://logo.clearbit.com/stripe.com" className="w-7 h-7 rounded-md object-contain" onError={(e) => e.target.style.display='none'} alt="" />
            <div className="text-left">
              <p className="text-sm font-semibold">Stripe</p>
              <p className="text-[11px] text-muted-foreground">Import all active subscriptions automatically</p>
            </div>
            {status.stripe === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-2" />}
          </div>
          {expanded.stripe ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {expanded.stripe && (
          <div className="px-4 pb-4 pt-1 border-t border-border/40 bg-muted/20">
            <p className="text-xs text-muted-foreground mb-2">Paste your Stripe <strong>Secret Key</strong> — we only read subscription data, never charge anything. <a href="https://dashboard.stripe.com/apikeys" target="_blank" className="text-primary underline">Get your key →</a></p>
            <div className="flex gap-2">
              <Input type="password" placeholder="sk_live_..." value={creds.stripeKey} onChange={(e) => setField("stripeKey", e.target.value)} className="text-sm" />
              <Button size="sm" onClick={connectStripe} disabled={!creds.stripeKey || status.stripe === "loading"} className="flex-shrink-0 gap-1.5">
                {status.stripe === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect"}
              </Button>
            </div>
            {messages.stripe && (
              <p className={`text-xs mt-1.5 ${status.stripe === "error" ? "text-destructive" : "text-emerald-600"}`}>{messages.stripe}</p>
            )}
          </div>
        )}
      </div>

      {/* Google Workspace */}
      <div className="border border-border/60 rounded-xl overflow-hidden">
        <button onClick={() => toggle("google")} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <img src="https://logo.clearbit.com/workspace.google.com" className="w-7 h-7 rounded-md object-contain" onError={(e) => e.target.style.display='none'} alt="" />
            <div className="text-left">
              <p className="text-sm font-semibold">Google Workspace</p>
              <p className="text-[11px] text-muted-foreground">Pull seat counts & user activity from your admin</p>
            </div>
            {status.google === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-2" />}
          </div>
          {expanded.google ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {expanded.google && (
          <div className="px-4 pb-4 pt-1 border-t border-border/40 bg-muted/20 space-y-2">
            <p className="text-xs text-muted-foreground">Enter your Google Workspace admin credentials to pull user counts and activity.</p>
            <Input placeholder="Domain (e.g. yourcompany.com)" value={creds.gwDomain} onChange={(e) => setField("gwDomain", e.target.value)} className="text-sm" />
            <Input placeholder="Admin email" value={creds.gwAdminEmail} onChange={(e) => setField("gwAdminEmail", e.target.value)} className="text-sm" />
            <Input type="password" placeholder="Service account JSON key" value={creds.gwServiceKey} onChange={(e) => setField("gwServiceKey", e.target.value)} className="text-sm" />
            <Button size="sm" onClick={connectGoogle} disabled={!creds.gwDomain || !creds.gwAdminEmail || !creds.gwServiceKey || status.google === "loading"} className="gap-1.5">
              {status.google === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect Workspace"}
            </Button>
            {messages.google && (
              <p className={`text-xs mt-0.5 ${status.google === "error" ? "text-destructive" : "text-emerald-600"}`}>{messages.google}</p>
            )}
          </div>
        )}
      </div>

      {/* CSV Upload */}
      <div className="border border-border/60 rounded-xl overflow-hidden">
        <button onClick={() => toggle("csv")} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">CSV / Spreadsheet</p>
              <p className="text-[11px] text-muted-foreground">Upload a spreadsheet with your tool list & costs</p>
            </div>
            {status.csv === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-2" />}
          </div>
          {expanded.csv ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {expanded.csv && (
          <div className="px-4 pb-4 pt-1 border-t border-border/40 bg-muted/20">
            <p className="text-xs text-muted-foreground mb-2">Upload any CSV or Excel file with columns like <code className="bg-muted px-1 rounded">tool_name, monthly_cost, licensed_seats, active_users</code>. Our AI will extract the data.</p>
            <div className="flex gap-2">
              <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setCsvFile(e.target.files[0])} className="text-xs text-muted-foreground file:mr-2 file:text-xs file:px-2 file:py-1 file:rounded file:border-0 file:bg-primary/10 file:text-primary" />
              <Button size="sm" onClick={handleCsvUpload} disabled={!csvFile || status.csv === "loading"} className="flex-shrink-0 gap-1.5">
                {status.csv === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              </Button>
            </div>
            {messages.csv && (
              <p className={`text-xs mt-1.5 ${status.csv === "error" ? "text-destructive" : "text-emerald-600"}`}>{messages.csv}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}