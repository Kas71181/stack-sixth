import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONNECTOR_ID = "6a106c5087f4c81a5248929b";

export default function ExportToSheetsButton({ tools, auditName }) {
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(null);
  const [checking, setChecking] = useState(true);

  const checkConnection = async () => {
    try {
      await base44.functions.invoke("exportToGoogleSheets", { tools: [], auditName: "" });
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        await checkConnection();
      } else {
        setChecking(false);
      }
    });
  }, []);

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        checkConnection();
      }
    }, 500);
  };

  const handleExport = async () => {
    setLoading(true);
    setSheetUrl(null);
    try {
      const res = await base44.functions.invoke("exportToGoogleSheets", { tools, auditName });
      setSheetUrl(res.data.spreadsheetUrl);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  if (checking) return null;

  if (sheetUrl) {
    return (
      <a href={sheetUrl} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50">
          <CheckCircle2 className="w-4 h-4" />
          Open Sheet
          <ExternalLink className="w-3 h-3" />
        </Button>
      </a>
    );
  }

  if (!connected) {
    return (
      <Button variant="outline" size="sm" className="gap-2" onClick={handleConnect}>
        <Sheet className="w-4 h-4 text-green-600" />
        Connect Google Sheets
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={loading || tools.length === 0}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sheet className="w-4 h-4 text-green-600" />}
      {loading ? "Exporting..." : "Export to Sheets"}
    </Button>
  );
}