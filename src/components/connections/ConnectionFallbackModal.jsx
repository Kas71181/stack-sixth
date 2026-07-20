import { createPortal } from "react-dom";
import { FileUp, MailSearch, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConnectionFallbackModal({ toolName, onGmail, onUpload, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="glass-strong relative w-full max-w-md p-5 animate-scale-in">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><h2 className="font-bold">Verify {toolName}</h2><p className="mt-1 text-sm text-muted-foreground">Choose the easiest evidence source available.</p></div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <Button className="h-auto w-full justify-start p-4 text-left" onClick={onGmail}>
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