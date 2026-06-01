import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Shared handler for the OnboardingWizard onComplete callback.
 * Deduplicates the same logic that was copy-pasted in StackDashboard and IntegrationsPage.
 */
export function useWizardImport({ integrations = [], companies = [] } = {}) {
  const qc = useQueryClient();

  const handleWizardComplete = async ({ company, tools }) => {
    // Create company only if none exists yet
    if (company.name && companies.length === 0) {
      await base44.entities.Company.create({
        name: company.name,
        industry: company.industry,
        employee_count: company.employee_count ? Number(company.employee_count) : null,
        monthly_saas_budget: company.monthly_saas_budget ? Number(company.monthly_saas_budget) : null,
      });
    }

    for (const tool of tools) {
      const exists = integrations.find(
        (i) => i.tool_name?.toLowerCase() === tool.tool_name?.toLowerCase()
      );
      if (!exists) {
        await base44.entities.SaasIntegration.create({
          tool_name: tool.tool_name,
          category: tool.category || "Other",
          monthly_cost: tool.monthly_cost || null,
          licensed_seats: tool.licensed_seats || null,
          active_users: tool.active_users || null,
          connection_status: tool.connection_status || "Connected",
          last_synced: new Date().toISOString().split("T")[0],
        });
      }
    }

    qc.invalidateQueries({ queryKey: ["integrations"] });
    qc.invalidateQueries({ queryKey: ["companies"] });
  };

  return { handleWizardComplete };
}