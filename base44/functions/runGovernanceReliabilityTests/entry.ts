import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { autoRenewalStatus, budgetEvaluation, contractFingerprint, daysBetweenDateOnly, deduplicateContracts, isVerifiedRenewal, potentialOverlap, renewalConflict, subtractNoticeDays, validPurchaseTransition } from '../../shared/governanceReliability.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me(); if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const cases = [
      ['renewal within 60 days', daysBetweenDateOnly('2026-01-01','2026-03-02') === 60],
      ['year boundary deadline', subtractNoticeDays('2026-01-15',30) === '2025-12-16'],
      ['leap-year deadline', subtractNoticeDays('2028-03-30',30) === '2028-02-29'],
      ['90-day deadline', subtractNoticeDays('2026-12-01',90) === '2026-09-02'],
      ['unknown notice has no deadline', subtractNoticeDays('2026-12-01',null) === null],
      ['auto-renew yes', autoRenewalStatus({auto_renews:true}) === 'yes'],
      ['auto-renew no', autoRenewalStatus({auto_renews:false}) === 'no'],
      ['auto-renew unknown', autoRenewalStatus({}) === 'unknown'],
      ['gmail candidate is not verified', !isVerifiedRenewal({renewal_date:'2026-12-01',verification_status:'detected',needs_confirmation:true})],
      ['customer confirmation is verified state', isVerifiedRenewal({renewal_date:'2026-12-01',verification_status:'customer_confirmed',needs_confirmation:false})],
      ['duplicate contracts suppressed', deduplicateContracts([{id:'1',source_fingerprint:'same',verification_status:'detected'},{id:'2',source_fingerprint:'same',verification_status:'verified'}])[0].id === '2'],
      ['conflicting renewal retained', renewalConflict({vendor_name:'Slack',renewal_date:'2026-11-01'},{vendor_name:'Slack',renewal_date:'2026-10-15'}).length === 1],
      ['same category is potential only', potentialOverlap({tool_name:'Asana',category:'Project Management'},[{tool_name:'Monday',category:'Project Management'}]).warnings[0].startsWith('Potential overlap')],
      ['missing budget unavailable', budgetEvaluation(null,50,2).status === 'unavailable' && budgetEvaluation(null,50,2).impactPct === null],
      ['requested cost distinct', budgetEvaluation(1000,50,2).monthlyRequestedCost === 100],
      ['invalid cost unavailable', budgetEvaluation(1000,-1,2).monthlyRequestedCost === null],
      ['approval transition valid', validPurchaseTransition('pending','approved')],
      ['approval does not provision', !validPurchaseTransition('pending','provisioned')],
      ['completed request immutable', !validPurchaseTransition('provisioned','approved')],
      ['fingerprint tenant isolated', contractFingerprint({company_id:'a',vendor_name:'Slack',renewal_date:'2026-01-01'}) !== contractFingerprint({company_id:'b',vendor_name:'Slack',renewal_date:'2026-01-01'})]
    ];
    return Response.json({ passed: cases.every(([,passed]) => passed), tests: cases.map(([name,passed]) => ({name,passed})) });
  } catch (error) { console.error('Governance reliability tests failed', error); return Response.json({ error: error.message }, { status: 500 }); }
}