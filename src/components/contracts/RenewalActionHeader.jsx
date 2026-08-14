import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RenewalActionHeader({ onAdd, onUpload }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="text-lg font-bold">Renewal intelligence</h2>
      <p className="mt-1 text-sm text-muted-foreground">Track upcoming software renewals before they become expensive surprises.</p>
    </div>
    <div className="flex flex-col-reverse gap-2 sm:flex-row">
      <Button variant="outline" onClick={onUpload}><Upload className="h-4 w-4" />Upload contract</Button>
      <Button onClick={onAdd}><Plus className="h-4 w-4" />Add renewal</Button>
    </div>
  </div>;
}