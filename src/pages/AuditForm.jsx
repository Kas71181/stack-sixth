import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Globe, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import StepCompanyInfo from "../components/audit/StepCompanyInfo";
import StepProcesses from "../components/audit/StepProcesses";
import StepExistingSoftware from "../components/audit/StepExistingSoftware";

const STEPS = [
  { key: "info", title: "Company Info", subtitle: "Tell us about your team" },
  { key: "processes", title: "Workflows & Pain Points", subtitle: "What does your team need?" },
  { key: "software", title: "Current Stack", subtitle: "What are you using today?" },
];

const SYSTEM_PROMPT = `You are Stack Sixth, an AI CFO for Software Spend.

Analyze the provided company context — including any ICP (Ideal Customer Profile) data derived from their website — and return software recommendations optimized for savings, fit, and integration.

IMPORTANT:
- Return ONLY valid JSON.
- Do not include markdown, code fences, or extra text.
- If uncertain, make best-effort assumptions and list them in "assumptions".

Rules:
1. Return 3 to 5 recommendations.
2. match_score must be between 0 and 100. Use the ICP profile to increase or decrease match scores based on industry fit and company stage.
3. Do not recommend exact duplicates from existing_software unless replacement_candidate_for is set with ROI justification.
4. For startup users, bias toward essential low-friction tools and include adopt_now_or_later.
5. For optimize users, bias toward integration, consolidation, and savings opportunities.
6. Keep recommendations practical and budget-aware.
7. Use concise, specific business reasoning that references the company's ICP where relevant (industry, growth stage, customer type).
8. If ICP data is available, tailor why_it_fits bullets to explicitly reference the company's industry, business model, or growth stage.

Now generate the JSON response from the input context.`;

export default function AuditForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(""); // "icp" | "analysis"

  // Seed from URL params (website referral) first, then fall back to last audit
  const urlParams = new URLSearchParams(window.location.search);
  const [formData, setFormData] = useState({
    company_name: urlParams.get("company_name") || "",
    company_website: urlParams.get("website") || "",
    user_type: urlParams.get("type") || "",
    team_size: urlParams.get("team_size") ? parseInt(urlParams.get("team_size")) : "",
    monthly_budget: urlParams.get("budget") ? parseInt(urlParams.get("budget")) : "",
    business_processes: [],
    pain_points: [],
    existing_software: [],
  });

  // Pre-fill from the user's most recent completed audit if fields still empty
  useEffect(() => {
    if (!user?.id) return;
    base44.entities.SoftwareAudit.filter({ created_by_id: user.id }, "-created_date", 1).then((audits) => {
      const last = audits?.[0];
      if (!last) return;
      setFormData((prev) => {
        const rawSoftware = prev.existing_software.length ? prev.existing_software : (last.existing_software || []);
        const seen = new Set();
        const dedupedSoftware = rawSoftware.filter((s) => {
          const key = s.name?.toLowerCase().trim();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return {
          company_name: prev.company_name || last.company_name || "",
          company_website: prev.company_website || last.company_website || "",
          user_type: prev.user_type || last.user_type || "",
          team_size: prev.team_size || last.team_size || "",
          monthly_budget: prev.monthly_budget || last.monthly_budget || "",
          business_processes: prev.business_processes.length ? prev.business_processes : (last.business_processes || []),
          pain_points: prev.pain_points.length ? prev.pain_points : (last.pain_points || []),
          existing_software: dedupedSoftware,
        };
      });
    });
  }, [user?.id]);

  const update = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

  // Track funnel step views
  useEffect(() => {
    const stepNames = ["audit_step_company_info", "audit_step_processes", "audit_step_software"];
    base44.analytics.track({ eventName: stepNames[step], properties: { step } });
  }, [step]);

  const canProceed = () => {
    if (step === 0) return formData.company_name && formData.user_type && formData.team_size;
    if (step === 1) return formData.business_processes.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    base44.analytics.track({ eventName: "audit_submitted", properties: { user_type: formData.user_type, team_size: formData.team_size, tool_count: formData.existing_software.length } });

    // Step 1: Fetch ICP from website if provided
    let icpProfile = null;
    if (formData.company_website) {
      setLoadingStep("icp");
      icpProfile = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this company's online presence and extract their Ideal Customer Profile (ICP) and business context.
Company name: ${formData.company_name}
Website/URL: ${formData.company_website}

Return a structured ICP profile with: industry, business_model (B2B/B2C/B2B2C), company_stage (startup/growth/enterprise), primary_customers (who they sell to), key_use_cases (what they do), tech_maturity (low/medium/high), and growth_focus (cost_reduction/scaling/automation/compliance).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            industry: { type: "string" },
            business_model: { type: "string" },
            company_stage: { type: "string" },
            primary_customers: { type: "string" },
            key_use_cases: { type: "array", items: { type: "string" } },
            tech_maturity: { type: "string" },
            growth_focus: { type: "string" },
            summary: { type: "string" },
          },
        },
      });
    }

    setLoadingStep("analysis");
    const seen = new Set();
    const dedupedSoftware = formData.existing_software.filter((s) => {
      const key = s.name?.toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const input = {
      company_name: formData.company_name,
      company_website: formData.company_website || null,
      user_type: formData.user_type,
      team_size: formData.team_size,
      monthly_budget: formData.monthly_budget || null,
      business_processes: formData.business_processes,
      pain_points: formData.pain_points,
      existing_software: dedupedSoftware,
      icp_profile: icpProfile || null,
    };

    const audit = await base44.entities.SoftwareAudit.create({
      ...input,
      status: "pending",
    });

    // Navigate immediately — Results page will poll until completed
    setLoading(false);
    setLoadingStep("");
    navigate(`/results/${audit.id}?new=1`);

    // Run analysis in background
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\nInput:\n${JSON.stringify(input, null, 2)}`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            budget_fit: { type: "string" },
            suggested_stack_total: { type: "number" },
            quick_wins: { type: "array", items: { type: "string" } },
            assumptions: { type: "array", items: { type: "string" } },
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
                  adopt_now_or_later: { type: "string" },
                  replacement_candidate_for: { type: "string" },
                  estimated_savings_opportunity: { type: "number" },
                  migration_risk: { type: "string" },
                },
              },
            },
          },
        },
      });
      await base44.entities.SoftwareAudit.update(audit.id, {
        analysis_result: result,
        icp_profile: icpProfile || null,
        status: "completed",
      });
      base44.analytics.track({ eventName: "audit_completed", properties: { user_type: formData.user_type, tool_count: formData.existing_software.length } });

      // Auto-contribute anonymized data to the benchmark network
      const teamSize = formData.team_size || 10;
      const sizeRange = teamSize <= 10 ? "1-10" : teamSize <= 50 ? "11-50" : teamSize <= 200 ? "51-200" : teamSize <= 500 ? "201-500" : "500+";
      try {
        await base44.functions.invoke("submitBenchmark", {
          integrations: dedupedSoftware.map((s) => ({
            tool_name: s.name,
            category: s.category || "",
            monthly_cost: s.monthly_cost || 0,
            licensed_seats: 0,
            active_users: 0,
          })),
          company_size: sizeRange,
        });
      } catch {}
    } catch {
      await base44.entities.SoftwareAudit.update(audit.id, { status: "error" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 flex-shrink-0 ${
                i < step
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : i === step
                  ? "bg-primary text-primary-foreground shadow-glow-sm"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm font-medium hidden sm:inline transition-colors ${
                i <= step ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.title}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px transition-all duration-300 ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="glass-card border border-border/50 rounded-2xl p-6 sm:p-8">
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
                  {loadingStep === "icp" ? "Building ICP..." : "Analyzing Stack..."}
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