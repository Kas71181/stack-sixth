import { base44 } from "@/api/base44Client";

export function trackAcquisition(eventName, properties = {}) {
  base44.analytics.track({ eventName, properties });
  return base44.auth.isAuthenticated().then((authed) => authed ? base44.entities.AcquisitionEvent.create({ event_name: eventName, properties, occurred_at: new Date().toISOString() }) : null).catch(() => null);
}