import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { freshnessStatus } from '../../shared/usageReliability.ts';
import { requireAdmin } from '../../shared/requireAdmin.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const access = await requireAdmin(base44);
    if (access.error) return access.error;
    const connections = await base44.asServiceRole.entities.IntegrationConnection.list('-updated_date', 500);
    let downgraded = 0;
    for (const connection of connections) {
      const status = freshnessStatus(connection.connector_type, connection.provider_data_current_through || connection.last_successful_sync_at);
      await base44.asServiceRole.entities.IntegrationConnection.update(connection.id, { health_status: status });
      if (status !== 'stale') continue;
      const organizationSeats = await base44.asServiceRole.entities.ApplicationSeat.filter({ organization_id: connection.organization_id });
      const seats = organizationSeats.filter((seat) => seat.activity_source === connection.connector_type);
      const updates = seats.filter((seat) => seat.usage_verified).map((seat) => ({ id: seat.id, usage_verified: false, evidence_level: 'INSUFFICIENT_EVIDENCE', usage_evidence_level: 'INSUFFICIENT_EVIDENCE', data_freshness_status: 'stale', data_freshness: 'stale', usage_classification: 'INSUFFICIENT_EVIDENCE', confidence_level: 'insufficient' }));
      if (updates.length) await base44.asServiceRole.entities.ApplicationSeat.bulkUpdate(updates);
      downgraded += updates.length;
    }
    return Response.json({ success: true, connectionsChecked: connections.length, seatsDowngraded: downgraded });
  } catch (error) {
    console.error('Usage freshness enforcement failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}