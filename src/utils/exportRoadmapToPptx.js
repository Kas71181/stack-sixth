import PptxGenJS from "pptxgenjs";

const BRAND_BLUE = "1D4ED8";
const BRAND_LIGHT = "EFF6FF";
const GRAY = "6B7280";
const DARK = "111827";
const WHITE = "FFFFFF";
const GREEN = "059669";
const AMBER = "D97706";
const VIOLET = "7C3AED";

const THEMES = [
  {
    key: "cost",
    name: "Cost & Waste",
    color: GREEN,
    tagline: "Find and reclaim wasted spend",
    initiatives: [
      { month: "Jul", title: "Billing-Reconciled Waste Detection", desc: "Auto-match licensed seats against Stripe billing to surface true wasted spend — not estimates." },
      { month: "Aug", title: "Negotiation Intelligence", desc: "Crowd-sourced playbooks with competitor pricing, usage leverage, and target discount benchmarks per vendor." },
      { month: "Sep", title: "Spend Anomaly Alerts", desc: "Automated cost-spike detection with downgrade and seat-reclamation recommendations routed to IT." },
    ],
  },
  {
    key: "usage",
    name: "Usage Intelligence",
    color: BRAND_BLUE,
    tagline: "Replace estimates with live telemetry",
    initiatives: [
      { month: "Jul", title: "Deep Engagement Signals", desc: "Move beyond login recency — pull meeting counts, commits, content creation, and engagement metrics from Slack, GitHub, Notion, and Zoom." },
      { month: "Aug", title: "HRIS Reconciliation", desc: "Auto-flag orphaned seats for offboarded employees by reconciling against BambooHR headcount." },
      { month: "Sep", title: "Data Confidence Scoring", desc: "Per-tool confidence score combining data freshness, field completeness, and source reliability so IT knows what to trust." },
    ],
  },
  {
    key: "governance",
    name: "Governance",
    color: VIOLET,
    tagline: "Policy-driven procurement and compliance",
    initiatives: [
      { month: "Jul", title: "AI Purchase Approvals", desc: "Purchase requests auto-evaluated against active policies — redundancy blocking, budget caps, and category rules." },
      { month: "Aug", title: "Role-Based Access Policies", desc: "Define required, allowed, and blocked tools per role; flag out-of-policy tool assignments as waste." },
      { month: "Sep", title: "Compliance-Ready Audit Trail", desc: "Full event log with actor tracking, status changes, and one-click export for SOC 2 / internal audits." },
    ],
  },
];

export async function exportRoadmapToPptx() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  // ── Slide 1: Title ─────────────────────────────────────────────
  const s1 = pptx.addSlide();
  s1.background = { color: BRAND_BLUE };
  s1.addText("Product Roadmap", {
    x: 0.6, y: 1.6, w: 12, h: 1,
    fontSize: 40, bold: true, color: WHITE, fontFace: "Calibri",
  });
  s1.addText("Q3 2026  •  Cost & Waste · Usage Intelligence · Governance", {
    x: 0.6, y: 2.7, w: 12, h: 0.6,
    fontSize: 20, color: "93C5FD", fontFace: "Calibri",
  });
  s1.addText("Stack Sixth — Software Procurement Operating System", {
    x: 0.6, y: 6.8, w: 12, h: 0.3,
    fontSize: 11, color: "93C5FD", italic: true,
  });

  // ── Slide 2: Overview / Themes ──────────────────────────────────
  const s2 = pptx.addSlide();
  s2.addText("Q3 2026 Themes", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: DARK });
  s2.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.95, w: 12, h: 0, line: { color: BRAND_BLUE, width: 2 } });
  s2.addText("Three focus areas driving measurable IT outcomes this quarter.", {
    x: 0.5, y: 1.1, w: 12, h: 0.4, fontSize: 13, color: GRAY,
  });

  THEMES.forEach((theme, i) => {
    const x = 0.5 + i * 4.2;
    s2.addShape(pptx.ShapeType.rect, { x, y: 1.7, w: 4.0, h: 4.5, fill: { color: WHITE }, line: { color: "E5E7EB", width: 1 } });
    s2.addShape(pptx.ShapeType.rect, { x, y: 1.7, w: 4.0, h: 0.55, fill: { color: theme.color } });
    s2.addText(theme.name, { x, y: 1.72, w: 4.0, h: 0.5, fontSize: 14, bold: true, color: WHITE, align: "center", valign: "middle" });
    s2.addText(theme.tagline, { x: x + 0.2, y: 2.4, w: 3.6, h: 0.4, fontSize: 11, color: GRAY, italic: true });
    theme.initiatives.forEach((init, ii) => {
      const iy = 2.95 + ii * 1.1;
      s2.addShape(pptx.ShapeType.rect, { x: x + 0.15, y: iy, w: 0.7, h: 0.35, fill: { color: BRAND_LIGHT } });
      s2.addText(init.month, { x: x + 0.15, y: iy, w: 0.7, h: 0.35, fontSize: 10, bold: true, color: theme.color, align: "center", valign: "middle" });
      s2.addText(init.title, { x: x + 0.95, y: iy, w: 2.9, h: 0.35, fontSize: 11, bold: true, color: DARK });
      s2.addText(init.desc, { x: x + 0.15, y: iy + 0.4, w: 3.7, h: 0.6, fontSize: 9, color: GRAY, wrap: true });
    });
  });

  // ── Slide 3-5: One slide per theme ──────────────────────────────
  THEMES.forEach((theme) => {
    const s = pptx.addSlide();
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.9, fill: { color: theme.color } });
    s.addText(theme.name, { x: 0.5, y: 0.1, w: 9, h: 0.7, fontSize: 22, bold: true, color: WHITE });
    s.addText("Q3 2026", { x: 9.5, y: 0.2, w: 3.3, h: 0.5, fontSize: 14, color: WHITE, align: "right" });

    theme.initiatives.forEach((init, i) => {
      const y = 1.2 + i * 1.8;
      s.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 12.3, h: 1.55, fill: { color: i % 2 === 0 ? BRAND_LIGHT : "F9FAFB" }, line: { color: "E5E7EB", width: 0.5 } });
      s.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 1.2, h: 1.55, fill: { color: theme.color } });
      s.addText(init.month, { x: 0.5, y: y + 0.4, w: 1.2, h: 0.6, fontSize: 18, bold: true, color: WHITE, align: "center", valign: "middle" });
      s.addText(init.title, { x: 1.9, y: y + 0.15, w: 10.5, h: 0.4, fontSize: 15, bold: true, color: DARK });
      s.addText(init.desc, { x: 1.9, y: y + 0.6, w: 10.7, h: 0.8, fontSize: 12, color: GRAY, wrap: true });
    });

    s.addText(`Theme: ${theme.tagline}`, {
      x: 0.5, y: 6.8, w: 12, h: 0.3, fontSize: 10, italic: true, color: GRAY,
    });
  });

  // ── Slide 6: Timeline ───────────────────────────────────────────
  const s6 = pptx.addSlide();
  s6.addText("Quarterly Timeline", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 24, bold: true, color: DARK });
  s6.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.95, w: 12, h: 0, line: { color: BRAND_BLUE, width: 2 } });

  const months = ["July", "August", "September"];
  months.forEach((month, mi) => {
    const x = 0.5 + mi * 4.2;
    s6.addShape(pptx.ShapeType.rect, { x, y: 1.2, w: 4.0, h: 0.5, fill: { color: BRAND_BLUE } });
    s6.addText(month, { x, y: 1.2, w: 4.0, h: 0.5, fontSize: 14, bold: true, color: WHITE, align: "center", valign: "middle" });

    THEMES.forEach((theme, ti) => {
      const init = theme.initiatives[mi];
      const y = 1.9 + ti * 1.55;
      s6.addShape(pptx.ShapeType.rect, { x, y, w: 4.0, h: 1.4, fill: { color: WHITE }, line: { color: "E5E7EB", width: 1 } });
      s6.addShape(pptx.ShapeType.rect, { x, y, w: 4.0, h: 0.08, fill: { color: theme.color } });
      s6.addText(theme.name, { x: x + 0.15, y: y + 0.12, w: 3.7, h: 0.3, fontSize: 9, bold: true, color: theme.color });
      s6.addText(init.title, { x: x + 0.15, y: y + 0.42, w: 3.7, h: 0.35, fontSize: 11, bold: true, color: DARK, wrap: true });
      s6.addText(init.desc, { x: x + 0.15, y: y + 0.78, w: 3.7, h: 0.55, fontSize: 9, color: GRAY, wrap: true });
    });
  });

  // ── Slide 7: Closing ────────────────────────────────────────────
  const sLast = pptx.addSlide();
  sLast.background = { color: BRAND_BLUE };
  sLast.addText("The Outcome", { x: 0.6, y: 0.8, w: 12, h: 0.8, fontSize: 32, bold: true, color: WHITE });
  sLast.addShape(pptx.ShapeType.line, { x: 0.6, y: 1.65, w: 4, h: 0, line: { color: "93C5FD", width: 2 } });

  const outcomes = [
    "Every dollar of SaaS spend traced to a live, verified user — not an estimate.",
    "Offboarded employees' seats flagged and reclaimed within days, not quarters.",
    "Every purchase request auto-evaluated against policy before it hits a credit card.",
    "A single dashboard IT leaders trust for cost, usage, and compliance — demoed today.",
  ];
  outcomes.forEach((text, i) => {
    sLast.addShape(pptx.ShapeType.rect, { x: 0.6, y: 2.0 + i * 1.0, w: 0.5, h: 0.5, fill: { color: "93C5FD" } });
    sLast.addText(String(i + 1), { x: 0.6, y: 2.0 + i * 1.0, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: BRAND_BLUE, align: "center", valign: "middle" });
    sLast.addText(text, { x: 1.3, y: 2.05 + i * 1.0, w: 11, h: 0.45, fontSize: 14, color: WHITE, wrap: true });
  });

  sLast.addText("Stack Sixth  •  stacksixth.com", {
    x: 0.6, y: 6.8, w: 12, h: 0.3, fontSize: 10, color: "93C5FD", italic: true,
  });

  await pptx.writeFile({ fileName: "Stack_Sixth_Q3_2026_Roadmap.pptx" });
}

export { THEMES };