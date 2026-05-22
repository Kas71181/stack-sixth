import PptxGenJS from "pptxgenjs";

const BRAND_BLUE = "1D4ED8";
const BRAND_LIGHT = "EFF6FF";
const GRAY = "6B7280";
const DARK = "111827";
const WHITE = "FFFFFF";
const GREEN = "059669";
const YELLOW = "D97706";
const RED = "DC2626";

function priorityColor(p) {
  if (p === "high") return RED;
  if (p === "medium") return YELLOW;
  return GRAY;
}

export async function exportAuditToPptx(audit) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  const result = audit.analysis_result || {};
  const recs = result.recommendations || [];
  const totalCurrentSpend = (audit.existing_software || []).reduce((s, t) => s + (t.monthly_cost || 0), 0);
  const totalSavings = recs.reduce((s, r) => s + (r.estimated_savings_opportunity || 0), 0);
  const annualSavings = totalSavings * 12;

  // ── Slide 1: Title ─────────────────────────────────────────────
  const s1 = pptx.addSlide();
  s1.background = { color: BRAND_BLUE };
  s1.addText("Software Stack Audit", {
    x: 0.6, y: 1.5, w: 12, h: 1,
    fontSize: 40, bold: true, color: WHITE, fontFace: "Calibri",
  });
  s1.addText(audit.company_name, {
    x: 0.6, y: 2.6, w: 12, h: 0.6,
    fontSize: 26, color: "93C5FD", fontFace: "Calibri",
  });
  s1.addText(`Team: ${audit.team_size} people  •  Budget: $${(audit.monthly_budget || 0).toLocaleString()}/mo  •  ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`, {
    x: 0.6, y: 3.4, w: 12, h: 0.4,
    fontSize: 14, color: "BFDBFE", fontFace: "Calibri",
  });
  s1.addText("Prepared by Stack Sixth AI", {
    x: 0.6, y: 6.8, w: 12, h: 0.3,
    fontSize: 11, color: "93C5FD", italic: true,
  });

  // ── Slide 2: Executive Summary ──────────────────────────────────
  const s2 = pptx.addSlide();
  s2.addText("Executive Summary", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: DARK });
  s2.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.95, w: 12, h: 0, line: { color: BRAND_BLUE, width: 2 } });

  if (result.summary) {
    s2.addText(result.summary, {
      x: 0.5, y: 1.1, w: 12, h: 1.4,
      fontSize: 13, color: GRAY, wrap: true, fontFace: "Calibri",
    });
  }

  // Stats row
  const stats = [
    { label: "Monthly Spend", value: `$${totalCurrentSpend.toLocaleString()}`, color: BRAND_BLUE },
    { label: "Monthly Savings", value: `$${totalSavings.toLocaleString()}`, color: GREEN },
    { label: "Annual Savings", value: `$${annualSavings.toLocaleString()}`, color: GREEN },
    { label: "Tools Reviewed", value: String(recs.length), color: BRAND_BLUE },
  ];
  stats.forEach((stat, i) => {
    const x = 0.5 + i * 3.1;
    s2.addShape(pptx.ShapeType.rect, { x, y: 2.7, w: 2.9, h: 1.5, fill: { color: BRAND_LIGHT }, line: { color: "DBEAFE", width: 1 } });
    s2.addText(stat.value, { x, y: 2.9, w: 2.9, h: 0.7, fontSize: 26, bold: true, color: stat.color, align: "center" });
    s2.addText(stat.label, { x, y: 3.6, w: 2.9, h: 0.4, fontSize: 11, color: GRAY, align: "center" });
  });

  // Quick wins
  if (result.quick_wins?.length > 0) {
    s2.addText("Quick Wins", { x: 0.5, y: 4.4, w: 12, h: 0.4, fontSize: 14, bold: true, color: DARK });
    result.quick_wins.slice(0, 4).forEach((win, i) => {
      s2.addText(`${i + 1}.  ${win}`, { x: 0.5, y: 4.9 + i * 0.45, w: 12, h: 0.4, fontSize: 12, color: GRAY, wrap: true });
    });
  }

  // ── Slide 3: Top Recommendations ───────────────────────────────
  const topRecs = recs.slice(0, 6);
  if (topRecs.length > 0) {
    const s3 = pptx.addSlide();
    s3.addText("Top Recommendations", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: DARK });
    s3.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.95, w: 12, h: 0, line: { color: BRAND_BLUE, width: 2 } });

    topRecs.forEach((rec, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = 0.5 + col * 4.2;
      const y = 1.1 + row * 2.6;
      s3.addShape(pptx.ShapeType.rect, { x, y, w: 4.0, h: 2.4, fill: { color: WHITE }, line: { color: "E5E7EB", width: 1 } });
      s3.addText(rec.name, { x: x + 0.15, y: y + 0.12, w: 3.7, h: 0.5, fontSize: 13, bold: true, color: DARK, wrap: true });
      s3.addText(rec.category || "", { x: x + 0.15, y: y + 0.6, w: 3.7, h: 0.3, fontSize: 10, color: GRAY });
      s3.addText(`Match: ${rec.match_score || "—"}`, { x: x + 0.15, y: y + 0.95, w: 1.8, h: 0.3, fontSize: 10, color: BRAND_BLUE });
      if (rec.estimated_savings_opportunity > 0) {
        s3.addText(`Save $${rec.estimated_savings_opportunity}/mo`, { x: x + 0.15, y: y + 1.3, w: 3.7, h: 0.3, fontSize: 11, bold: true, color: GREEN });
      }
      const pLabel = (rec.implementation_priority || "low").toUpperCase();
      s3.addText(pLabel, { x: x + 0.15, y: y + 1.75, w: 1.5, h: 0.3, fontSize: 9, bold: true, color: priorityColor(rec.implementation_priority) });
      s3.addText(rec.adopt_now_or_later === "now" ? "Adopt Now" : "Adopt Later", { x: x + 1.8, y: y + 1.75, w: 2, h: 0.3, fontSize: 9, color: GRAY });
    });
  }

  // ── Slide 4: ROI Projection ─────────────────────────────────────
  if (totalSavings > 0) {
    const s4 = pptx.addSlide();
    s4.addText("ROI Projection", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: DARK });
    s4.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.95, w: 12, h: 0, line: { color: BRAND_BLUE, width: 2 } });

    // Year by year table
    const years = [1, 2, 3, 5];
    const headers = ["Horizon", "Monthly Savings", "Annual Savings", "Cumulative Savings", "Budget Reduction"];
    const colWidths = [1.5, 2.2, 2.2, 2.5, 2.5];
    const startX = 0.5;
    let ty = 1.1;

    // Header row
    headers.forEach((h, ci) => {
      const cx = startX + colWidths.slice(0, ci).reduce((a, b) => a + b, 0);
      s4.addShape(pptx.ShapeType.rect, { x: cx, y: ty, w: colWidths[ci], h: 0.45, fill: { color: BRAND_BLUE } });
      s4.addText(h, { x: cx, y: ty, w: colWidths[ci], h: 0.45, fontSize: 11, bold: true, color: WHITE, align: "center", valign: "middle" });
    });
    ty += 0.45;

    years.forEach((yr, ri) => {
      const monthly = totalSavings;
      const annual = monthly * 12;
      const cumulative = annual * yr;
      const budgetReduction = audit.monthly_budget ? ((monthly / audit.monthly_budget) * 100).toFixed(1) + "%" : "—";
      const rowVals = [`${yr} Year${yr > 1 ? "s" : ""}`, `$${monthly.toLocaleString()}`, `$${annual.toLocaleString()}`, `$${cumulative.toLocaleString()}`, budgetReduction];
      const rowBg = ri % 2 === 0 ? "F9FAFB" : WHITE;
      rowVals.forEach((val, ci) => {
        const cx = startX + colWidths.slice(0, ci).reduce((a, b) => a + b, 0);
        s4.addShape(pptx.ShapeType.rect, { x: cx, y: ty, w: colWidths[ci], h: 0.42, fill: { color: rowBg }, line: { color: "E5E7EB", width: 0.5 } });
        s4.addText(val, { x: cx, y: ty, w: colWidths[ci], h: 0.42, fontSize: 12, color: ci === 3 ? GREEN : DARK, align: "center", valign: "middle", bold: ci === 3 });
      });
      ty += 0.42;
    });

    // Note
    s4.addText("* Based on full adoption of all identified savings opportunities.", {
      x: 0.5, y: ty + 0.2, w: 12, h: 0.35, fontSize: 10, italic: true, color: GRAY,
    });

    // Highlight box
    s4.addShape(pptx.ShapeType.rect, { x: 0.5, y: 4.5, w: 12.3, h: 1.5, fill: { color: "F0FDF4" }, line: { color: "BBF7D0", width: 1 } });
    s4.addText("5-Year Cumulative Savings Potential", { x: 0.8, y: 4.65, w: 8, h: 0.4, fontSize: 13, color: DARK });
    s4.addText(`$${(totalSavings * 12 * 5).toLocaleString()}`, { x: 0.8, y: 5.05, w: 8, h: 0.7, fontSize: 36, bold: true, color: GREEN });
    s4.addText(`${audit.monthly_budget ? ((totalSavings / audit.monthly_budget) * 100).toFixed(0) : "—"}% monthly budget reduction`, {
      x: 7.5, y: 4.85, w: 5, h: 0.6, fontSize: 16, color: BRAND_BLUE, align: "right", bold: true,
    });
  }

  // ── Slide 5: Detailed Recommendations ──────────────────────────
  recs.slice(0, 8).forEach((rec, i) => {
    const s = pptx.addSlide();
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.9, fill: { color: BRAND_BLUE } });
    s.addText(`${i + 1}. ${rec.name}`, { x: 0.5, y: 0.1, w: 9, h: 0.7, fontSize: 20, bold: true, color: WHITE });
    s.addText(rec.category || "", { x: 9.5, y: 0.2, w: 3.3, h: 0.5, fontSize: 12, color: "93C5FD", align: "right" });

    let cy = 1.05;
    // Key metrics row
    const metrics = [
      { label: "Match Score", value: rec.match_score || "—", color: BRAND_BLUE },
      { label: "Monthly Cost", value: rec.estimated_monthly_cost != null ? `$${rec.estimated_monthly_cost}` : "—", color: DARK },
      { label: "Monthly Savings", value: rec.estimated_savings_opportunity > 0 ? `$${rec.estimated_savings_opportunity}` : "—", color: GREEN },
      { label: "Migration Risk", value: rec.migration_risk || "—", color: rec.migration_risk === "high" ? RED : rec.migration_risk === "medium" ? YELLOW : GREEN },
    ];
    metrics.forEach((m, mi) => {
      const x = 0.5 + mi * 3.1;
      s.addShape(pptx.ShapeType.rect, { x, y: cy, w: 2.9, h: 1.1, fill: { color: BRAND_LIGHT }, line: { color: "DBEAFE", width: 1 } });
      s.addText(String(m.value), { x, y: cy + 0.1, w: 2.9, h: 0.55, fontSize: 20, bold: true, color: m.color, align: "center" });
      s.addText(m.label, { x, y: cy + 0.65, w: 2.9, h: 0.3, fontSize: 10, color: GRAY, align: "center" });
    });
    cy += 1.3;

    // Why it fits
    if (rec.why_it_fits?.length > 0) {
      s.addText("Why It Fits", { x: 0.5, y: cy, w: 6, h: 0.35, fontSize: 13, bold: true, color: DARK });
      rec.why_it_fits.slice(0, 3).forEach((w, wi) => {
        s.addText(`✓  ${w}`, { x: 0.5, y: cy + 0.4 + wi * 0.38, w: 6, h: 0.35, fontSize: 11, color: GRAY, wrap: true });
      });
    }

    // Savings note
    if (rec.savings_or_roi_note) {
      s.addShape(pptx.ShapeType.rect, { x: 6.8, y: cy, w: 6, h: 1.6, fill: { color: "F0FDF4" }, line: { color: "BBF7D0", width: 1 } });
      s.addText("ROI Note", { x: 7.0, y: cy + 0.1, w: 5.6, h: 0.35, fontSize: 11, bold: true, color: GREEN });
      s.addText(rec.savings_or_roi_note, { x: 7.0, y: cy + 0.45, w: 5.6, h: 1.0, fontSize: 11, color: DARK, wrap: true });
    }
  });

  // ── Slide 6: Next Steps ─────────────────────────────────────────
  const sLast = pptx.addSlide();
  sLast.background = { color: BRAND_BLUE };
  sLast.addText("Next Steps", { x: 0.6, y: 0.8, w: 12, h: 0.8, fontSize: 32, bold: true, color: WHITE });
  sLast.addShape(pptx.ShapeType.line, { x: 0.6, y: 1.65, w: 4, h: 0, line: { color: "93C5FD", width: 2 } });

  const highPri = recs.filter((r) => r.implementation_priority === "high").slice(0, 3);
  const steps = highPri.length > 0
    ? highPri.map((r) => `Implement ${r.name} — ${r.adopt_now_or_later === "now" ? "start immediately" : "plan for next quarter"}`)
    : ["Review top recommendations with your team", "Prioritize quick wins for immediate savings", "Schedule vendor evaluations"];

  steps.forEach((step, i) => {
    sLast.addShape(pptx.ShapeType.rect, { x: 0.6, y: 2.0 + i * 1.0, w: 0.5, h: 0.5, fill: { color: "93C5FD" } });
    sLast.addText(String(i + 1), { x: 0.6, y: 2.0 + i * 1.0, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: BRAND_BLUE, align: "center", valign: "middle" });
    sLast.addText(step, { x: 1.3, y: 2.05 + i * 1.0, w: 11, h: 0.45, fontSize: 14, color: WHITE, wrap: true });
  });

  sLast.addText("Generated by Stack Sixth AI  •  stacksixth.com", {
    x: 0.6, y: 6.8, w: 12, h: 0.3, fontSize: 10, color: "93C5FD", italic: true,
  });

  await pptx.writeFile({ fileName: `${audit.company_name.replace(/\s+/g, "_")}_Audit_Report.pptx` });
}