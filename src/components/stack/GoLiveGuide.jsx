import { ChevronDown, CircleCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { connectorFor } from "@/lib/inventoryConnectors";

function getSteps(tool, status) {
  const connector = connectorFor(tool.tool_name);
  if (!connector) return [
    "A native OAuth or API usage connector must become available for this software.",
    "Until then, keep private reports current so ownership, cost, and access remain evidenced.",
  ];
  if (connector.setupRequired) return [
    `Ask a workspace administrator to configure the ${connector.label} ${connector.authMode || "OAuth"} connector.`,
    "Grant read-only access to members, licenses, and activity reporting.",
    "Reconnect the software and complete a successful usage sync.",
  ];
  if (status.key === "pending") return [
    "Open Connect inventory and replace or complete the required credentials.",
    "Confirm every required read-only member and activity scope is enabled.",
    "Run verification again, then complete the first successful usage sync.",
  ];
  if (status.key === "connected") return [
    "Grant organization or workspace access, not only personal account access.",
    "Enable read-only member, license, activity, audit, or reporting scopes offered by the provider.",
    "Reconnect and run a sync that returns verified user activity.",
  ];
  return [
    "Open Connect inventory and choose the available OAuth or API method.",
    "Grant read-only access to members, licenses, and activity reporting.",
    "Complete verification and run the first successful usage sync.",
  ];
}

export default function GoLiveGuide({ tool, status }) {
  const steps = getSteps(tool, status);
  return <Collapsible className="basis-full border-t border-border/60 pt-3">
    <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-primary hover:bg-primary/5">
      What is needed to go live
      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="px-2 pb-1 pt-3">
      <ol className="space-y-2">{steps.map((step, index) => <li key={step} className="flex gap-2 text-xs text-muted-foreground"><CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><span><strong className="text-foreground">Step {index + 1}.</strong> {step}</span></li>)}</ol>
      {tool.evidence_note && <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground"><strong className="text-foreground">Current evidence:</strong> {tool.evidence_note}</p>}
      <Link to="/my-stack?tab=connect" className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline">Open Connect inventory</Link>
    </CollapsibleContent>
  </Collapsible>;
}