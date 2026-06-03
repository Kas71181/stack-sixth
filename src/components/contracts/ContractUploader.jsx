import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, Sparkles, X } from "lucide-react";

export default function ContractUploader({ onComplete, onCancel }) {
  const [stage, setStage] = useState("idle"); // idle | uploading | extracting | done
  const [fileName, setFileName] = useState("");
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setStage("uploading");

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    setStage("extracting");
    const res = await base44.functions.invoke("extractContract", { file_url });

    if (res.data?.success) {
      setStage("done");
      setTimeout(onComplete, 800);
    } else {
      setStage("idle");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">AI Contract Extractor</h3>
        </div>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {stage === "idle" && (
        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-semibold text-sm">Drop a PDF invoice or contract here</p>
          <p className="text-xs text-muted-foreground mt-1">Supports PDF, PNG, JPG — AI extracts vendor, cost, renewal date & terms</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <Button size="sm" variant="outline" className="mt-4 gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Browse Files
          </Button>
        </div>
      )}

      {(stage === "uploading" || stage === "extracting") && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            {stage === "uploading" ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            )}
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm">{stage === "uploading" ? "Uploading..." : "AI is reading your contract..."}</p>
            {fileName && <p className="text-xs text-muted-foreground mt-0.5">{fileName}</p>}
            {stage === "extracting" && (
              <p className="text-xs text-muted-foreground mt-2">Extracting vendor, costs, renewal dates & negotiation leverage</p>
            )}
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="font-semibold text-sm text-emerald-700">Contract extracted successfully!</p>
        </div>
      )}
    </div>
  );
}