import { createPortal } from "react-dom";
import { FileUp, KeyRound, MailSearch, Plug, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConnectionFallbackModal({ toolName, primaryType, primaryLabel, onPrimary, onGmail, onUpload, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="glass-strong relative w-full max-w-md p-5 animate-scale-in">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><h2 className="font-bold">Connect {toolName}</h2><p className="mt-1 text-sm text-muted-foreground">Choose the secure connection method that works for you.</p></div>
          <button aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          {onPrimary && <Button className="h-auto w-full justify-start p-4 text-left" onClick={onPrimary}>
            {primaryType === "oauth" ? <Plug className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}<span><span className="block">{primaryLabel}</span><span className="block text-xs font-normal opacity-80">Recommended for verified live data</span></span>
          </Button>}
          <Button variant={onPrimary ? "outline" : "default"} className="h-auto w-full justify-start p-4 text-left" onClick={onGmail}>
            <MailSearch className="h-5 w-5" /><span><span className="block">Scan Gmail evidence</span><span className="block text-xs font-normal opacity-80">Find vendor, billing and renewal signals</span></span>
          </Button>
          <Button variant="outline" className="h-auto w-full justify-start p-4 text-left" onClick={onUpload}>
            <FileUp className="h-5 w-5" /><span><span className="block">Upload a report</span><span className="block text-xs font-normal text-muted-foreground">Add a private vendor usage or billing export</span></span>
          </Button>
        </div>
      </div>
    </div>, document.body
  );
}