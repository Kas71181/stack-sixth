export const CONNECTOR_CAPABILITIES = {
  gmail: { application_discovery: true, users: false, seat_assignments: false, login_activity: false, deep_usage: false, spend: false, invoices: true, contracts: true, renewals: true, identity_activity: false },
  google_workspace_admin: { application_discovery: true, users: true, seat_assignments: true, login_activity: true, deep_usage: false, spend: false, invoices: false, contracts: false, renewals: false, identity_activity: true },
  microsoft_entra: { application_discovery: true, users: true, seat_assignments: true, login_activity: true, deep_usage: false, spend: false, invoices: false, contracts: false, renewals: false, identity_activity: true },
  okta: { application_discovery: true, users: true, seat_assignments: true, login_activity: true, deep_usage: false, spend: false, invoices: false, contracts: false, renewals: false, identity_activity: true },
  slack: { application_discovery: false, users: true, seat_assignments: true, login_activity: false, deep_usage: false, spend: false, invoices: false, contracts: false, renewals: false, identity_activity: false },
  github: { application_discovery: false, users: true, seat_assignments: true, login_activity: false, deep_usage: false, spend: false, invoices: false, contracts: false, renewals: false, identity_activity: false },
  notion: { application_discovery: false, users: true, seat_assignments: false, login_activity: false, deep_usage: false, spend: false, invoices: false, contracts: false, renewals: false, identity_activity: false },
  stripe_billing: { application_discovery: true, users: false, seat_assignments: false, login_activity: false, deep_usage: false, spend: true, invoices: true, contracts: false, renewals: true, identity_activity: false }
};

export function connectorSupports(connectorType, capability) {
  return CONNECTOR_CAPABILITIES[connectorType]?.[capability] === true;
}