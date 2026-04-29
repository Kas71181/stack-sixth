import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import StepCompanyInfo from "../components/audit/StepCompanyInfo";
import StepProcesses from "../components/audit/StepProcesses";
import StepExistingSoftware from "../components/audit/StepExistingSoftware";

const STEPS = [
  { key: "info", title: "Company Info", subtitle: "Tell us about your team" },
  { key: "processes", title: "Workflows & Pain Points", subtitle: "What does your team need?" },
  { key: "software", title: "Current Stack", subtitle: "What are you using today?" },
];

const SYSTEM_PROMPT = `You are Stack Sixth AI, an AI CFO for Software Spend.

Your role is to recommend software decisions that reduce waste, improve integration, and maximize ROI for SMB teams.

PRIMARY OBJECTIVE
- Save the company money on software while improving operational fit.
- Recommend practical tools/actions, not generic lists.
- Keep advice concise, specific, and implementation-ready.

DECISION LOGIC
1) Savings-first: prioritize high value-to-cost outcomes.
2) Fit-first: align with team size, maturity, and workflows.
3) Integration-first: for optimize users, prefer tools that connect to current stack.
4) No duplicates: do not recommend tools already in existing_software unless replacing them with clear ROI.
5) Practicality: account for onboarding effort, migration risk, and time-to-value.
6) Budget discipline: keep recommendations within or near budget where possible.
7) Transparency: when data is missing, proceed with assumptions and state them clearly.

OUTPUT RULES (STRICT)
- Return ONLY valid JSON.
- No markdown, no code fences, no commentary.
- recommendations length must be 3 to 5.
- match_score must be integer 0-100.
- implementation_priority must be one of: "high", "medium", "low".
- migration_risk must be one of: "low", "medium", "high", "unknown".
- adopt_timing must be one of: "now", "later".
- If unknown cost/savings, use null (not text placeholders).

JSON SCHEMA
{
  "summary": "string",
  "budget_fit": "within_budget | near_limit | over_budget | unknown",
  "suggested_stack_total": number | null,
  "quick_wins": ["string"],
  "assumptions": ["string"],
  "overlap_flags": [
    {
      "tools": ["string"],
      "reason": "string",
      "estimated_monthly_waste": number | null
    }
  ],
  "recommendations": [
    {
      "name": "string",
      "category": "string",
      "estimated_monthly_cost": number | null,
      "match_score": 0,
      "why_it_fits": ["string"],
      "integration_notes": ["string"],
      "savings_or_roi_note": "string",
      "implementation_priority": "high | medium | low",
      "adopt_timing": "now | later",
      "replacement_candidate_for": "string | null",
      "estimated_savings_opportunity": number | null,
      "migration_risk": "low | medium | high | unknown"
    }
  ],
  "next_30_day_plan": ["string"]
}

QUALITY BAR
- Prefer specific recommendations tied to the provided business context.
- Mention concrete integration pairings when possible.
- Keep each bullet short and actionable.
- Avoid hype language.`;

export default function AuditForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    user_type: "",
    team_size: "",
    monthly_budget: "",
    business_processes: [],
    pain_points: [],
    existing_software: [],
  });

  const update = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  const canProceed = () => {
    if (step === 0) return formData.company_name && formData.user_type && formData.team_size;
    if (step === 1) return formData.business_processes.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const input = {
      company_name: formData.company_name,
      user_type: formData.user_type,
      team_size: formData.team_size,
      monthly_budget: formData.monthly_budget || null,
      business_processes: formData.business_processes,
      pain_points: formData.pain_points,
      existing_software: formData.existing_software,
    };

    const audit = await base44.entities.SoftwareAudit.create({
      ...input,
      status: "pending",
    });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT}\n\nNow produce the JSON output from the given input:\n${JSON.stringify(input, null, 2)}`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          budget_fit: { type: "string" },
          suggested_stack_total: { type: "number" },
          quick_wins: { type: "array", items: { type: "string" } },
          assumptions: { type: "array", items: { type: "string" } },
          overlap_flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tools: { type: "array", items: { type: "string" } },
                reason: { type: "string" },
                estimated_monthly_waste: { type: "number" },
              },
            },
          },
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                estimated_monthly_cost: { type: "number" },
                match_score: { type: "number" },
                why_it_fits: { type: "array", items: { type: "string" } },
                integration_notes: { type: "array", items: { type: "string" } },
                savings_or_roi_note: { type: "string" },
                implementation_priority: { type: "string" },
                adopt_timing: { type: "string" },
                replacement_candidate_for: { type: "string" },
                estimated_savings_opportunity: { type: "number" },
                migration_risk: { type: "string" },
              },
            },
          },
          next_30_day_plan: { type: "array", items: { type: "string" } },
        },
      },
    });

    await base44.entities.SoftwareAudit.update(audit.id, {
      analysis_result: result,
      status: "completed",
    });

    setLoading(false);
    navigate(`/results/${audit.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                i <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm font-medium hidden sm:inline ${
                i <= step ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.title}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold">{STEPS[step].title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{STEPS[step].subtitle}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && <StepCompanyInfo data={formData} onChange={update} />}
            {step === 1 && <StepProcesses data={formData} onChange={update} />}
            {step === 2 && <StepExistingSoftware data={formData} onChange={update} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/60">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="gap-1.5"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="gap-2 px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Analysis
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}