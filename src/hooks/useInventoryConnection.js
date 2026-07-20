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

export default function useInventoryConnection({ tool, connector, isLive, onSynced }) {
  const [status, setStatus] = useState(isLive ? "live" : "idle");
  const [error, setError] = useState("");
  useEffect(() => setStatus(isLive ? "live" : "idle"), [isLive]);

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
        setStatus("evidence");
        return;
      }
      await base44.entities.SaasIntegration.update(tool.id, {
        connection_status: "Connected", last_synced: new Date().toISOString().slice(0, 10),
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