export const ENTITLEMENTS = {
  FREE_LAUNCH: { integration_limit: 2, software_inventory: true, spend_visibility: true, audits: true, usage_intelligence: "basic", savings: true, contracts: "basic", ai_assistance: "limited", reporting: "basic", governance: false },
  STARTER: { integration_limit: 5, software_inventory: true, spend_visibility: true, audits: true, usage_intelligence: "full", savings: true, contracts: "full", ai_assistance: "full", reporting: "standard", governance: false },
  GROWTH: { integration_limit: 15, software_inventory: true, spend_visibility: true, audits: "advanced", usage_intelligence: "full", savings: true, contracts: "full", ai_assistance: "full", reporting: "advanced", governance: true, team_oversight: true, priority_support: true },
  SCALE: { integration_limit: -1, software_inventory: true, spend_visibility: true, audits: "advanced", usage_intelligence: "full", savings: true, contracts: "full", ai_assistance: "full", reporting: "executive", governance: "advanced", team_oversight: true, admin_controls: "advanced", procurement_intelligence: "advanced", priority_support: true },
  ENTERPRISE: { integration_limit: -1, software_inventory: true, spend_visibility: true, audits: "advanced", usage_intelligence: "full", savings: true, contracts: "full", ai_assistance: "full", reporting: "custom", governance: "custom", team_oversight: true, admin_controls: "custom", procurement_intelligence: "custom", priority_support: true }
};

export const getEntitlements = (plan) => ENTITLEMENTS[plan] || ENTITLEMENTS.FREE_LAUNCH;
export const addDays = (date, days) => new Date(date.getTime() + days * 86400000);
export const addMonths = (date, months) => { const next = new Date(date); next.setUTCMonth(next.getUTCMonth() + months); return next; };