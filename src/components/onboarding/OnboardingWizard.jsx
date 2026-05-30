import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import StepCompanySetup from "./StepCompanySetup";
import StepConnectSources from "./StepConnectSources";
import StepReviewImport from "./StepReviewImport";

const STEPS = [
  { id: "company", label: "Company" },
  { id: "connect", label: "Connect Sources" },
  { id: "review", label: "Review & Import" },
];

export default function OnboardingWizard({ onComplete, onDismiss }) {
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState({ name: "", industry: "SaaS", employee_count: "", monthly_saas_budget: "" });
  const [importedTools, setImportedTools] = useState([]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border/60 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Set Up Your SaaS Intelligence</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Connect your tools to auto-import spend & usage data</p>
            </div>
            <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  i < step ? "bg-emerald-100 text-emerald-700" :
                  i === step ? "bg-primary/10 text-primary" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle2 className="w-3 h-3" /> : <span>{i + 1}</span>}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < step ? "bg-emerald-300" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-5 min-h-[340px]">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="company" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <StepCompanySetup data={company} onChange={setCompany} />
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="connect" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <StepConnectSources company={company} onToolsImported={setImportedTools} existingTools={importedTools} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <StepReviewImport tools={importedTools} company={company} onToolsChange={setImportedTools} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between border-t border-border/40 pt-4">
          <div>
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={back} className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
            ) : (
              <button onClick={onDismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Skip setup
              </button>
            )}
          </div>
          <div>
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={next} disabled={step === 0 && !company.name.trim()} className="gap-1.5">
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => onComplete({ company, tools: importedTools })} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Finish & Import
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}