import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Aggregates all NegotiationPlaybook records into crowd-sourced vendor intelligence
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { vendor_name } = await req.json().catch(() => ({}));

    // Fetch all playbooks (RLS ensures user-scoped or admin sees all)
    const allPlaybooks = await base44.asServiceRole.entities.NegotiationPlaybook.filter({});

    // Filter by vendor if specified
    const playbooks = vendor_name
      ? allPlaybooks.filter((p) => p.vendor_name?.toLowerCase().includes(vendor_name.toLowerCase()))
      : allPlaybooks;

    // Group by vendor
    const byVendor = {};
    for (const p of playbooks) {
      const key = p.vendor_name?.trim() || 'Unknown';
      if (!byVendor[key]) {
        byVendor[key] = {
          vendor_name: key,
          total: 0,
          won: 0,
          lost: 0,
          in_progress: 0,
          pending: 0,
          actual_discounts: [],
          target_discounts: [],
          walk_away_prices: [],
          talking_points: {},
          competitor_alternatives: {},
        };
      }
      const v = byVendor[key];
      v.total++;
      if (p.outcome === 'won') v.won++;
      if (p.outcome === 'lost') v.lost++;
      if (p.outcome === 'in_progress') v.in_progress++;
      if (p.outcome === 'pending') v.pending++;
      if (p.actual_discount_pct != null) v.actual_discounts.push(p.actual_discount_pct);
      if (p.target_discount_pct != null) v.target_discounts.push(p.target_discount_pct);
      if (p.walk_away_price != null) v.walk_away_prices.push(p.walk_away_price);
      for (const tp of (p.talking_points || [])) {
        v.talking_points[tp] = (v.talking_points[tp] || 0) + 1;
      }
      for (const alt of (p.competitor_alternatives || [])) {
        v.competitor_alternatives[alt] = (v.competitor_alternatives[alt] || 0) + 1;
      }
    }

    // Build vendor intelligence array
    const vendorIntelligence = Object.values(byVendor).map((v) => {
      const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;
      const topN = (obj, n) => Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([text, count]) => ({ text, count }));

      return {
        vendor_name: v.vendor_name,
        total_negotiations: v.total,
        won: v.won,
        lost: v.lost,
        in_progress: v.in_progress,
        pending: v.pending,
        win_rate: v.won + v.lost > 0 ? Math.round(v.won / (v.won + v.lost) * 100) : null,
        avg_actual_discount_pct: avg(v.actual_discounts),
        avg_target_discount_pct: avg(v.target_discounts),
        avg_walk_away_price: avg(v.walk_away_prices),
        top_talking_points: topN(v.talking_points, 5),
        top_competitor_alternatives: topN(v.competitor_alternatives, 5),
      };
    }).sort((a, b) => b.total_negotiations - a.total_negotiations);

    // Overall stats
    const wonPlaybooks = playbooks.filter((p) => p.outcome === 'won');
    const totalDiscounts = wonPlaybooks
      .filter((p) => p.actual_discount_pct != null)
      .map((p) => p.actual_discount_pct);
    const overallStats = {
      total_negotiations: playbooks.length,
      total_won: wonPlaybooks.length,
      total_lost: playbooks.filter((p) => p.outcome === 'lost').length,
      total_in_progress: playbooks.filter((p) => p.outcome === 'in_progress').length,
      overall_win_rate: playbooks.filter((p) => p.outcome === 'won' || p.outcome === 'lost').length > 0
        ? Math.round(wonPlaybooks.length / playbooks.filter((p) => p.outcome === 'won' || p.outcome === 'lost').length * 100)
        : null,
      avg_discount_won: totalDiscounts.length > 0
        ? Math.round(totalDiscounts.reduce((a, b) => a + b, 0) / totalDiscounts.length * 10) / 10
        : null,
      vendors_tracked: Object.keys(byVendor).length,
    };

    return Response.json({
      success: true,
      overall: overallStats,
      vendors: vendorIntelligence,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});