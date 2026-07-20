import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const waitForClose = (popup) => new Promise((resolve) => {
  const timer = window.setInterval(() => {
    if (!popup || popup.closed) {
      window.clearInterval(timer);
      resolve();
    }
  }, 500);
});

const savedStatus = (tool, isLive) => isLive
  ? "live"
  : tool.connection_status === "Evidence"
    ? "evidence"
    : tool.connection_status === "Manual Auth" ? "manual"
      : tool.connection_status === "Manual Upload" ? "snapshot" : "idle";

export default function useInventoryConnection({ tool, connector, isLive, onSynced }) {
  const [status, setStatus] = useState(savedStatus(tool, isLive));
  const [error, setError] = useState("");
  useEffect(() => setStatus(savedStatus(tool, isLive)), [isLive, tool.connection_status]);

  const connect = async () => {
    setStatus("authorizing");
    setError("");
    try {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) return base44.auth.redirectToLogin(window.location.href);
      const popup = window.open("", "_blank", "width=620,height=760");
      if (!popup) throw new Error("Please allow pop-ups to connect this tool.");
      const liveOrigin = window.location.origin.replace("preview--", "");
      const url = connector.oauthFunction
        ? (await base44.functions.invoke(connector.oauthFunction, {
            callback_url: `${liveOrigin}/functions/${connector.oauthFunction}`,
          })).data.url
        : await base44.connectors.connectAppUser(connector.connectorId);
      popup.location.href = url;
      await waitForClose(popup);
      setStatus("syncing");
      const result = await base44.functions.invoke(connector.functionName, {});
      if (!result.data?.success) throw new Error(result.data?.error || "Sync failed.");
      if (connector.connectionMode === "evidence") {
        const normalized = tool.tool_name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const workspaceAccess = normalized === "googleworkspace";
        const found = workspaceAccess || (result.data.tools || []).some((item) => {
          const name = (item.name || item.tool_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          return name && (name === normalized || name.includes(normalized) || normalized.includes(name));
        });
        await base44.entities.SaasIntegration.update(tool.id, {
          connection_status: found ? "Evidence" : "Pending",
          evidence_type: workspaceAccess ? "access" : found ? "financial" : "insufficient",
          evidence_checked_at: new Date().toISOString(),
          evidence_note: workspaceAccess ? "Google account access verified through Gmail" : found ? "Vendor or billing evidence found in Gmail" : "No matching evidence found in the latest Gmail scan",
        });
        setStatus(found ? "evidence" : "idle");
        if (!found) setError("No matching evidence was found. You can upload a report instead.");
        onSynced?.();
        return;
      }
      await base44.entities.SaasIntegration.update(tool.id, {
        connection_status: "Connected", evidence_type: "live", last_synced: new Date().toISOString().slice(0, 10),
        evidence_checked_at: new Date().toISOString(), evidence_note: "Verified through a live OAuth connection",
      });
      setStatus("live");
      onSynced?.();
    } catch (err) {
      setError(err?.message || "Connection failed.");
      setStatus("error");
    }
  };

  return { status, error, connect };
}