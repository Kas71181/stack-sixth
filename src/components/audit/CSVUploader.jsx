import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CSVUploader({ onToolsExtracted }) {
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setStatus("uploading");
    setErrorMsg("");

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

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
                name: { type: "string" },
                category: { type: "string" },
                monthly_cost: { type: "number" },
              },
            },
          },
        },
      },
    });

    if (result.status === "error" || !result.output?.tools?.length) {
      setStatus("error");
      setErrorMsg("Could not extract tools from this file. Make sure it has tool name and cost columns.");
      return;
    }

    setStatus("success");
    onToolsExtracted(result.output.tools);
  };

  return (
    <div className="mt-4">
      <p className="text-xs text-muted-foreground mb-2 font-medium">Or import from a file</p>
      <div
        className={`border-2 border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all ${
          status === "success"
            ? "border-emerald-300 bg-emerald-50"
            : status === "error"
            ? "border-destructive/40 bg-destructive/5"
            : "border-border hover:border-primary/40 hover:bg-muted/30"
        }`}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {status === "idle" && <Upload className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
        {status === "uploading" && <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />}
        {status === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
        {status === "error" && <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          {status === "idle" && (
            <>
              <p className="text-sm font-medium">Upload CSV, Excel, or invoice PDF</p>
              <p className="text-xs text-muted-foreground">We'll auto-extract tool names and costs</p>
            </>
          )}
          {status === "uploading" && <p className="text-sm font-medium text-primary">Extracting tools from {fileName}...</p>}
          {status === "success" && <p className="text-sm font-medium text-emerald-700">Tools imported from {fileName}</p>}
          {status === "error" && <p className="text-sm font-medium text-destructive">{errorMsg}</p>}
        </div>

        {(status === "success" || status === "error") && (
          <button
            onClick={(e) => { e.stopPropagation(); setStatus("idle"); setFileName(""); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}