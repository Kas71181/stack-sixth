import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";
import { recommendationReportData } from "@/utils/exportRecommendationReport";

const BRAND = { blue: "155EEF", navy: "0F172A", sky: "EAF2FF", slate: "64748B", line: "DCE3EE", white: "FFFFFF", green: "059669", amber: "B45309", red: "DC2626", canvas: "F6F8FC" };
const money = (value) => value == null ? "Not provided" : `$${Number(value).toLocaleString()}/month`;
const compactMoney = (value) => value == null ? "N/A" : `$${Number(value).toLocaleString()}`;
const safeName = (value = "Stack_Sixth") => value.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
const clean = (value, fallback = "Not provided") => String(value || fallback).replace(/[–—]/g, "-");
const reports = (recommendations, existingSoftware) => recommendations.map((rec) => ({ ...recommendationReportData(rec, existingSoftware), raw: rec }));
const generatedOn = () => new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const total = (items, key) => items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
const priorityColor = (priority) => priority === "high" ? BRAND.red : priority === "medium" ? BRAND.amber : BRAND.slate;

export function exportAllRecommendationsCsv(recommendations, existingSoftware, companyName) {
  const rows = [["Company", "Current tool", "Current monthly cost", "Recommendation", "Category", "Match score", "Priority", "Adoption timing", "Migration risk", "Recommended monthly cost", "Monthly cost difference", "Annualized difference", "Potential monthly savings", "Replacement candidate", "Why it fits", "Integration notes", "ROI note"]];
  reports(recommendations, existingSoftware).forEach((item) => rows.push([
    companyName, item.currentTool, item.currentCost ?? "", item.recommendation, item.category,
    item.raw.match_score ?? "", item.raw.implementation_priority ?? "", item.raw.adopt_now_or_later ?? "",
    item.raw.migration_risk ?? "", item.recommendedCost ?? "", item.difference ?? "",
    item.difference == null ? "" : item.difference * 12, item.raw.estimated_savings_opportunity ?? "",
    item.raw.replacement_candidate_for ?? "", item.reasons.join("; "),
    (item.raw.integration_notes || []).join("; "), item.roi,
  ]));
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.href = url;
  link.download = `${safeName(companyName)}_All_Recommendation_Reports.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportAllRecommendationsPdf(recommendations, existingSoftware, companyName) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const items = reports(recommendations, existingSoftware);
  const totalCurrent = total(items, "currentCost");
  const totalRecommended = total(items, "recommendedCost");
  const monthlyOpportunity = total(recommendations, "estimated_savings_opportunity");
  const annualOpportunity = monthlyOpportunity * 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const brandHeader = (section) => {
    doc.setFillColor(21, 94, 239); doc.rect(0, 0, pageWidth, 18, "F");
    doc.setFillColor(255, 255, 255); doc.roundedRect(14, 5, 7, 7, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("STACK SIXTH", 25, 11);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text(section.toUpperCase(), pageWidth - 14, 11, { align: "right" });
  };
  const footer = () => {
    doc.setDrawColor(220, 227, 238); doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
    doc.setTextColor(100, 116, 139); doc.setFontSize(7.5);
    doc.text(`Prepared by Stack Sixth  |  ${generatedOn()}  |  Confidential`, 14, pageHeight - 8);
    doc.text(String(doc.getNumberOfPages()), pageWidth - 14, pageHeight - 8, { align: "right" });
  };
  const sectionTitle = (title, subtitle, y = 30) => {
    doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.text(title, 14, y);
    if (subtitle) { doc.setTextColor(100, 116, 139); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(subtitle, 14, y + 7); }
  };
  const metric = (x, y, w, label, value, accent = [21, 94, 239]) => {
    doc.setFillColor(246, 248, 252); doc.setDrawColor(220, 227, 238); doc.roundedRect(x, y, w, 24, 2, 2, "FD");
    doc.setTextColor(...accent); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(String(value), x + 4, y + 10);
    doc.setTextColor(100, 116, 139); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.text(label.toUpperCase(), x + 4, y + 18);
  };

  doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setFillColor(21, 94, 239); doc.circle(178, 32, 44, "F");
  doc.setFillColor(37, 114, 255); doc.circle(18, 276, 36, "F");
  doc.setFillColor(255, 255, 255); doc.roundedRect(16, 20, 11, 11, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text("STACK SIXTH", 33, 28);
  doc.setFontSize(31); doc.text("Software Recommendation", 16, 92); doc.text("Portfolio Report", 16, 105);
  doc.setTextColor(147, 197, 253); doc.setFontSize(16); doc.text(clean(companyName, "Software portfolio audit"), 16, 122);
  doc.setTextColor(203, 213, 225); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(`${recommendations.length} evidence-informed recommendations`, 16, 139);
  doc.text(`Prepared ${generatedOn()}`, 16, 147);
  doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.text("Software spend intelligence for confident decisions", 16, 268);

  doc.addPage(); brandHeader("Executive summary"); sectionTitle("Executive Summary", `Portfolio analysis for ${clean(companyName, "your organization")}`);
  metric(14, 50, 41, "Tools reviewed", recommendations.length);
  metric(59, 50, 41, "Current spend", compactMoney(totalCurrent));
  metric(104, 50, 41, "Proposed spend", compactMoney(totalRecommended));
  metric(149, 50, 47, "Annual opportunity", compactMoney(annualOpportunity), [5, 150, 105]);
  doc.setFillColor(234, 242, 255); doc.setDrawColor(191, 219, 254); doc.roundedRect(14, 84, 182, 40, 3, 3, "FD");
  doc.setTextColor(21, 94, 239); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Executive takeaway", 20, 96);
  doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const takeaway = monthlyOpportunity > 0
    ? `The portfolio identifies ${compactMoney(monthlyOpportunity)} in potential monthly savings, equal to ${compactMoney(annualOpportunity)} annually. Prioritize high-match recommendations with low migration risk, then validate pricing and implementation effort before committing.`
    : "The recommendations prioritize fit, consolidation, and operating efficiency. Validate final vendor pricing, migration effort, security requirements, and stakeholder readiness before committing.";
  doc.text(doc.splitTextToSize(takeaway, 166), 20, 105);
  sectionTitle("Portfolio priorities", "A decision sequence based on the recommendation evidence", 144);
  const priorities = [
    ["1", "Validate", "Confirm requirements, pricing, data controls, and integration coverage."],
    ["2", "Prioritize", "Start with strong match scores, clear ROI, and manageable migration risk."],
    ["3", "Pilot", "Test the preferred tools with a focused user group and measurable success criteria."],
    ["4", "Decide", "Approve, defer, or reject based on evidence from the pilot and stakeholder review."],
  ];
  priorities.forEach(([number, title, body], index) => {
    const y = 160 + index * 24; doc.setFillColor(21, 94, 239); doc.circle(20, y + 4, 4, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text(number, 20, y + 5.2, { align: "center" });
    doc.setTextColor(15, 23, 42); doc.setFontSize(10); doc.text(title, 30, y + 2);
    doc.setTextColor(100, 116, 139); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.text(body, 30, y + 9);
  }); footer();

  doc.addPage(); brandHeader("Portfolio comparison"); sectionTitle("Recommendation Comparison", "A consolidated view of cost, fit, priority, and risk");
  const columns = [14, 57, 91, 116, 142, 169, 196];
  doc.setFillColor(15, 23, 42); doc.rect(14, 47, 182, 11, "F");
  ["Recommendation", "Current", "Proposed", "Match", "Priority", "Risk"].forEach((label, i) => {
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.text(label, columns[i] + 2, 54);
  });
  items.forEach((item, index) => {
    const y = 58 + index * 18; const raw = item.raw;
    doc.setFillColor(index % 2 ? 255 : 246, index % 2 ? 255 : 248, index % 2 ? 255 : 252); doc.rect(14, y, 182, 18, "F");
    doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text(clean(item.recommendation).slice(0, 24), 16, y + 7);
    doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139); doc.setFontSize(6.5); doc.text(clean(item.category).slice(0, 28), 16, y + 13);
    doc.setTextColor(15, 23, 42); doc.setFontSize(8); doc.text(compactMoney(item.currentCost), 59, y + 9); doc.text(compactMoney(item.recommendedCost), 93, y + 9);
    doc.setTextColor(21, 94, 239); doc.setFont("helvetica", "bold"); doc.text(`${raw.match_score ?? "N/A"}${raw.match_score != null ? "%" : ""}`, 119, y + 9);
    doc.setTextColor(priorityColor(raw.implementation_priority)); doc.text(clean(raw.implementation_priority, "N/A").toUpperCase(), 144, y + 9);
    doc.setTextColor(15, 23, 42); doc.text(clean(raw.migration_risk, "N/A").toUpperCase(), 171, y + 9);
  });
  const comparisonY = Math.min(220, 68 + items.length * 18);
  doc.setFillColor(240, 253, 244); doc.setDrawColor(187, 247, 208); doc.roundedRect(14, comparisonY, 182, 30, 3, 3, "FD");
  doc.setTextColor(5, 150, 105); doc.setFontSize(11); doc.text("Financial opportunity", 20, comparisonY + 11);
  doc.setTextColor(15, 23, 42); doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(`Potential savings: ${compactMoney(monthlyOpportunity)} monthly  |  ${compactMoney(annualOpportunity)} annualized`, 20, comparisonY + 21); footer();

  items.forEach((item, index) => {
    const raw = item.raw; doc.addPage(); brandHeader(`Recommendation ${index + 1} of ${items.length}`);
    sectionTitle(clean(item.recommendation), clean(item.category));
    doc.setFillColor(234, 242, 255); doc.roundedRect(14, 48, 182, 16, 2, 2, "F");
    doc.setTextColor(21, 94, 239); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text(raw.replacement_candidate_for ? `REPLACEMENT CANDIDATE FOR ${clean(raw.replacement_candidate_for).toUpperCase()}` : "PORTFOLIO RECOMMENDATION", 20, 58);
    metric(14, 73, 41, "Match score", raw.match_score == null ? "N/A" : `${raw.match_score}%`);
    metric(59, 73, 41, "Current cost", compactMoney(item.currentCost));
    metric(104, 73, 41, "Proposed cost", compactMoney(item.recommendedCost));
    metric(149, 73, 47, "Monthly difference", compactMoney(item.difference), item.difference > 0 ? [5, 150, 105] : [21, 94, 239]);
    doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Decision profile", 14, 112);
    const profile = `Priority: ${clean(raw.implementation_priority, "Not provided")}  |  Timing: ${clean(raw.adopt_now_or_later, "Not provided")}  |  Migration risk: ${clean(raw.migration_risk, "Not provided")}`;
    doc.setTextColor(100, 116, 139); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(profile, 14, 120);
    doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Why it fits", 14, 137);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
    const reasons = item.reasons.length ? item.reasons.slice(0, 5) : ["No fit reasons were provided."];
    let y = 147; reasons.forEach((reason) => { const lines = doc.splitTextToSize(`•  ${clean(reason)}`, 84); doc.text(lines, 14, y); y += lines.length * 4.5 + 3; });
    doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Integration considerations", 108, 137);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
    const integrations = raw.integration_notes?.length ? raw.integration_notes.slice(0, 4) : ["Validate required integrations during the vendor review."];
    let iy = 147; integrations.forEach((note) => { const lines = doc.splitTextToSize(`•  ${clean(note)}`, 88); doc.text(lines, 108, iy); iy += lines.length * 4.5 + 3; });
    const boxY = Math.max(207, y + 5, iy + 5); doc.setFillColor(240, 253, 244); doc.setDrawColor(187, 247, 208); doc.roundedRect(14, boxY, 182, 36, 3, 3, "FD");
    doc.setTextColor(5, 150, 105); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("ROI and business impact", 20, boxY + 10);
    doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.text(doc.splitTextToSize(clean(item.roi, "ROI depends on final pricing and implementation scope."), 166), 20, boxY + 19); footer();
  });

  doc.addPage(); brandHeader("Decision framework"); sectionTitle("Recommended Next Steps", "Move from recommendation to an evidence-backed decision");
  [
    ["01", "Confirm business requirements", "Document must-have workflows, users, controls, integrations, and success measures."],
    ["02", "Validate commercial assumptions", "Request final pricing, implementation fees, contract terms, and expected support levels."],
    ["03", "Run a focused pilot", "Test top-priority options with representative users and track adoption, quality, and time saved."],
    ["04", "Assess migration readiness", "Review data portability, security, training, ownership, and cutover requirements."],
    ["05", "Record the decision", "Approve, defer, or reject each recommendation with an owner and target review date."],
  ].forEach(([number, title, body], index) => {
    const y = 52 + index * 38; doc.setFillColor(246, 248, 252); doc.setDrawColor(220, 227, 238); doc.roundedRect(14, y, 182, 29, 3, 3, "FD");
    doc.setTextColor(21, 94, 239); doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.text(number, 21, y + 18);
    doc.setTextColor(15, 23, 42); doc.setFontSize(10); doc.text(title, 43, y + 11);
    doc.setTextColor(100, 116, 139); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.text(doc.splitTextToSize(body, 140), 43, y + 19);
  });
  doc.setTextColor(100, 116, 139); doc.setFontSize(8); doc.text("Methodology: This report summarizes audit recommendations and user-provided software data. Cost figures are directional and should be validated with vendors. Recommendations do not replace security, legal, financial, or procurement review.", 14, 256, { maxWidth: 182 }); footer();
  doc.save(`${safeName(companyName)}_Stack_Sixth_Recommendation_Report.pdf`);
}

export async function exportAllRecommendationsPptx(recommendations, existingSoftware, companyName) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Stack Sixth";
  pptx.subject = "Software recommendation portfolio report";
  pptx.title = `${companyName || "Stack Sixth"} Recommendation Report`;
  pptx.company = "Stack Sixth";
  pptx.lang = "en-US";
  pptx.theme = { headFontFace: "Aptos Display", bodyFontFace: "Aptos", lang: "en-US" };
  const items = reports(recommendations, existingSoftware);
  const totalCurrent = total(items, "currentCost");
  const totalRecommended = total(items, "recommendedCost");
  const monthlyOpportunity = total(recommendations, "estimated_savings_opportunity");
  const annualOpportunity = monthlyOpportunity * 12;

  const addBrand = (slide, section, dark = false) => {
    if (!dark) slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.1, fill: { color: BRAND.blue }, line: { color: BRAND.blue } });
    slide.addShape(pptx.ShapeType.rect, { x: 0.55, y: 0.28, w: 0.34, h: 0.34, fill: { color: dark ? BRAND.white : BRAND.blue }, line: { color: dark ? BRAND.white : BRAND.blue }, radius: 0.05 });
    slide.addText("STACK SIXTH", { x: 1.0, y: 0.27, w: 2.3, h: 0.35, fontSize: 11, bold: true, color: dark ? BRAND.white : BRAND.navy, charSpacing: 1.2, margin: 0 });
    slide.addText(section.toUpperCase(), { x: 9.5, y: 0.3, w: 3.25, h: 0.3, fontSize: 8, bold: true, color: dark ? "93C5FD" : BRAND.slate, align: "right", charSpacing: 1.1, margin: 0 });
  };
  const addFooter = (slide, number, dark = false) => {
    slide.addShape(pptx.ShapeType.line, { x: 0.55, y: 7.05, w: 12.2, h: 0, line: { color: dark ? "334155" : BRAND.line, width: 0.6 } });
    slide.addText(`Stack Sixth  |  Confidential  |  ${generatedOn()}`, { x: 0.55, y: 7.12, w: 6.5, h: 0.18, fontSize: 7.5, color: dark ? "94A3B8" : BRAND.slate, margin: 0 });
    slide.addText(String(number), { x: 12.1, y: 7.12, w: 0.65, h: 0.18, fontSize: 7.5, color: dark ? "94A3B8" : BRAND.slate, align: "right", margin: 0 });
  };
  const title = (slide, heading, subheading) => {
    slide.addText(heading, { x: 0.55, y: 0.85, w: 8.8, h: 0.55, fontSize: 25, bold: true, color: BRAND.navy, margin: 0 });
    if (subheading) slide.addText(subheading, { x: 0.55, y: 1.46, w: 11.8, h: 0.34, fontSize: 11, color: BRAND.slate, margin: 0 });
  };
  const metric = (slide, x, y, w, label, value, color = BRAND.blue) => {
    slide.addShape(pptx.ShapeType.rect, { x, y, w, h: 1.1, fill: { color: BRAND.white }, line: { color: BRAND.line, width: 0.8 }, radius: 0.08, shadow: { type: "outer", color: "CBD5E1", opacity: 0.18, blur: 1, angle: 45, distance: 1 } });
    slide.addText(String(value), { x: x + 0.18, y: y + 0.18, w: w - 0.36, h: 0.4, fontSize: 20, bold: true, color, margin: 0 });
    slide.addText(label.toUpperCase(), { x: x + 0.18, y: y + 0.72, w: w - 0.36, h: 0.18, fontSize: 7.5, bold: true, color: BRAND.slate, charSpacing: 0.8, margin: 0 });
  };

  let page = 1;
  const cover = pptx.addSlide(); cover.background = { color: BRAND.navy };
  cover.addShape(pptx.ShapeType.ellipse, { x: 9.2, y: -1.6, w: 5.7, h: 5.7, fill: { color: BRAND.blue, transparency: 2 }, line: { color: BRAND.blue, transparency: 100 } });
  cover.addShape(pptx.ShapeType.ellipse, { x: -1.8, y: 5.1, w: 4.2, h: 4.2, fill: { color: "1D4ED8", transparency: 5 }, line: { color: "1D4ED8", transparency: 100 } });
  addBrand(cover, "Software intelligence", true);
  cover.addText("Software Recommendation", { x: 0.65, y: 2.1, w: 10.5, h: 0.7, fontSize: 36, bold: true, color: BRAND.white, margin: 0 });
  cover.addText("Portfolio Report", { x: 0.65, y: 2.86, w: 10.5, h: 0.7, fontSize: 36, bold: true, color: BRAND.white, margin: 0 });
  cover.addText(clean(companyName, "Software portfolio audit"), { x: 0.67, y: 3.78, w: 10, h: 0.45, fontSize: 18, color: "93C5FD", margin: 0 });
  cover.addText(`${recommendations.length} evidence-informed recommendations  |  ${generatedOn()}`, { x: 0.67, y: 4.42, w: 10, h: 0.3, fontSize: 11, color: "CBD5E1", margin: 0 });
  cover.addText("Software spend intelligence for confident decisions", { x: 0.67, y: 6.58, w: 7, h: 0.25, fontSize: 9, color: "94A3B8", margin: 0 });
  addFooter(cover, page++, true);

  const executive = pptx.addSlide(); executive.background = { color: BRAND.canvas }; addBrand(executive, "Executive summary");
  title(executive, "Executive Summary", `Portfolio analysis for ${clean(companyName, "your organization")}`);
  metric(executive, 0.55, 2.03, 2.85, "Tools reviewed", recommendations.length);
  metric(executive, 3.58, 2.03, 2.85, "Current spend", compactMoney(totalCurrent));
  metric(executive, 6.61, 2.03, 2.85, "Proposed spend", compactMoney(totalRecommended));
  metric(executive, 9.64, 2.03, 3.14, "Annual opportunity", compactMoney(annualOpportunity), BRAND.green);
  executive.addShape(pptx.ShapeType.rect, { x: 0.55, y: 3.48, w: 12.23, h: 1.35, fill: { color: BRAND.sky }, line: { color: "BFDBFE" }, radius: 0.08 });
  executive.addText("EXECUTIVE TAKEAWAY", { x: 0.82, y: 3.73, w: 2.3, h: 0.22, fontSize: 8, bold: true, color: BRAND.blue, charSpacing: 1, margin: 0 });
  const takeaway = monthlyOpportunity > 0
    ? `The portfolio identifies ${compactMoney(monthlyOpportunity)} in potential monthly savings, equal to ${compactMoney(annualOpportunity)} annually. Prioritize high-match recommendations with low migration risk, then validate pricing and implementation effort.`
    : "The portfolio prioritizes fit, consolidation, and operating efficiency. Validate vendor pricing, migration effort, security requirements, and stakeholder readiness before committing.";
  executive.addText(takeaway, { x: 0.82, y: 4.08, w: 11.3, h: 0.46, fontSize: 12, color: BRAND.navy, breakLine: false, fit: "shrink", margin: 0 });
  executive.addText("Decision sequence", { x: 0.55, y: 5.18, w: 3, h: 0.32, fontSize: 14, bold: true, color: BRAND.navy, margin: 0 });
  [["01", "Validate", "Requirements and pricing"], ["02", "Prioritize", "Fit, ROI, and risk"], ["03", "Pilot", "Users and success criteria"], ["04", "Decide", "Approve, defer, or reject"]].forEach(([number, label, note], index) => {
    const x = 0.55 + index * 3.08; executive.addShape(pptx.ShapeType.rect, { x, y: 5.68, w: 2.85, h: 0.8, fill: { color: BRAND.white }, line: { color: BRAND.line }, radius: 0.05 });
    executive.addText(number, { x: x + 0.16, y: 5.87, w: 0.42, h: 0.22, fontSize: 10, bold: true, color: BRAND.blue, margin: 0 });
    executive.addText(label, { x: x + 0.65, y: 5.79, w: 1.9, h: 0.23, fontSize: 10, bold: true, color: BRAND.navy, margin: 0 });
    executive.addText(note, { x: x + 0.65, y: 6.07, w: 1.95, h: 0.19, fontSize: 7.5, color: BRAND.slate, margin: 0 });
  }); addFooter(executive, page++);

  const comparison = pptx.addSlide(); comparison.background = { color: BRAND.canvas }; addBrand(comparison, "Portfolio comparison");
  title(comparison, "Recommendation Comparison", "Cost, fit, priority, and implementation risk in one view");
  const headers = ["Recommendation", "Current", "Proposed", "Match", "Priority", "Risk"];
  const widths = [3.7, 1.65, 1.65, 1.25, 1.65, 1.55];
  let x = 0.55; headers.forEach((header, index) => { comparison.addShape(pptx.ShapeType.rect, { x, y: 2.02, w: widths[index], h: 0.43, fill: { color: BRAND.navy }, line: { color: BRAND.navy } }); comparison.addText(header, { x: x + 0.1, y: 2.14, w: widths[index] - 0.2, h: 0.14, fontSize: 7.5, bold: true, color: BRAND.white, margin: 0 }); x += widths[index]; });
  items.slice(0, 8).forEach((item, row) => {
    const y = 2.45 + row * 0.48; const values = [item.recommendation, compactMoney(item.currentCost), compactMoney(item.recommendedCost), item.raw.match_score == null ? "N/A" : `${item.raw.match_score}%`, clean(item.raw.implementation_priority, "N/A").toUpperCase(), clean(item.raw.migration_risk, "N/A").toUpperCase()];
    let cx = 0.55; values.forEach((value, index) => { comparison.addShape(pptx.ShapeType.rect, { x: cx, y, w: widths[index], h: 0.48, fill: { color: row % 2 ? BRAND.white : "F1F5F9" }, line: { color: BRAND.line, width: 0.4 } }); comparison.addText(clean(value), { x: cx + 0.1, y: y + 0.14, w: widths[index] - 0.2, h: 0.18, fontSize: 8, bold: index === 0 || index === 3, color: index === 3 ? BRAND.blue : index === 4 ? priorityColor(item.raw.implementation_priority) : BRAND.navy, margin: 0, fit: "shrink" }); cx += widths[index]; });
  });
  comparison.addShape(pptx.ShapeType.rect, { x: 0.55, y: 6.38, w: 12.23, h: 0.46, fill: { color: "ECFDF5" }, line: { color: "A7F3D0" }, radius: 0.05 });
  comparison.addText(`Potential opportunity: ${compactMoney(monthlyOpportunity)} monthly  |  ${compactMoney(annualOpportunity)} annualized`, { x: 0.78, y: 6.52, w: 11.5, h: 0.18, fontSize: 10, bold: true, color: BRAND.green, margin: 0 }); addFooter(comparison, page++);

  items.forEach((item, index) => {
    const raw = item.raw; const slide = pptx.addSlide(); slide.background = { color: BRAND.canvas }; addBrand(slide, `Recommendation ${index + 1} of ${items.length}`);
    title(slide, clean(item.recommendation), clean(item.category));
    slide.addShape(pptx.ShapeType.rect, { x: 9.55, y: 0.9, w: 3.23, h: 0.56, fill: { color: BRAND.sky }, line: { color: "BFDBFE" }, radius: 0.06 });
    slide.addText(raw.replacement_candidate_for ? `Alternative to ${clean(raw.replacement_candidate_for)}` : "Portfolio recommendation", { x: 9.75, y: 1.08, w: 2.8, h: 0.18, fontSize: 8.5, bold: true, color: BRAND.blue, align: "center", margin: 0, fit: "shrink" });
    metric(slide, 0.55, 2.03, 2.85, "Match score", raw.match_score == null ? "N/A" : `${raw.match_score}%`);
    metric(slide, 3.58, 2.03, 2.85, "Current cost", compactMoney(item.currentCost));
    metric(slide, 6.61, 2.03, 2.85, "Proposed cost", compactMoney(item.recommendedCost));
    metric(slide, 9.64, 2.03, 3.14, "Monthly difference", compactMoney(item.difference), item.difference > 0 ? BRAND.green : BRAND.blue);
    slide.addText("WHY IT FITS", { x: 0.55, y: 3.52, w: 2.5, h: 0.22, fontSize: 8, bold: true, color: BRAND.slate, charSpacing: 1, margin: 0 });
    const reasonText = item.reasons.length ? item.reasons.slice(0, 4).map((reason) => `•  ${clean(reason)}`).join("\n") : "•  No fit reasons were provided.";
    slide.addText(reasonText, { x: 0.55, y: 3.88, w: 5.82, h: 1.7, fontSize: 11, color: BRAND.navy, breakLine: false, fit: "shrink", valign: "top", margin: 0.04, breakLineOnOverflow: false });
    slide.addText("INTEGRATION CONSIDERATIONS", { x: 6.82, y: 3.52, w: 3.4, h: 0.22, fontSize: 8, bold: true, color: BRAND.slate, charSpacing: 1, margin: 0 });
    const integrationText = raw.integration_notes?.length ? raw.integration_notes.slice(0, 4).map((note) => `•  ${clean(note)}`).join("\n") : "•  Validate required integrations during vendor review.";
    slide.addText(integrationText, { x: 6.82, y: 3.88, w: 5.96, h: 1.7, fontSize: 11, color: BRAND.navy, fit: "shrink", valign: "top", margin: 0.04 });
    slide.addShape(pptx.ShapeType.rect, { x: 0.55, y: 5.72, w: 8.45, h: 0.93, fill: { color: "ECFDF5" }, line: { color: "A7F3D0" }, radius: 0.06 });
    slide.addText("ROI AND BUSINESS IMPACT", { x: 0.8, y: 5.92, w: 2.65, h: 0.18, fontSize: 7.5, bold: true, color: BRAND.green, charSpacing: 0.8, margin: 0 });
    slide.addText(clean(item.roi, "ROI depends on final pricing and implementation scope."), { x: 0.8, y: 6.18, w: 7.9, h: 0.27, fontSize: 9.5, color: BRAND.navy, fit: "shrink", margin: 0 });
    slide.addShape(pptx.ShapeType.rect, { x: 9.2, y: 5.72, w: 3.58, h: 0.93, fill: { color: BRAND.white }, line: { color: BRAND.line }, radius: 0.06 });
    slide.addText(`${clean(raw.implementation_priority, "N/A").toUpperCase()} PRIORITY`, { x: 9.42, y: 5.92, w: 1.55, h: 0.2, fontSize: 8, bold: true, color: priorityColor(raw.implementation_priority), margin: 0 });
    slide.addText(`${clean(raw.migration_risk, "N/A")} risk  |  ${clean(raw.adopt_now_or_later, "Timing N/A")}`, { x: 9.42, y: 6.21, w: 2.95, h: 0.18, fontSize: 8, color: BRAND.slate, margin: 0, fit: "shrink" }); addFooter(slide, page++);
  });

  const next = pptx.addSlide(); next.background = { color: BRAND.navy }; addBrand(next, "Decision framework", true);
  next.addText("Recommended Next Steps", { x: 0.65, y: 1.05, w: 8.5, h: 0.6, fontSize: 29, bold: true, color: BRAND.white, margin: 0 });
  next.addText("Move from recommendation to an evidence-backed decision", { x: 0.67, y: 1.78, w: 8.5, h: 0.3, fontSize: 12, color: "93C5FD", margin: 0 });
  [["01", "Confirm requirements", "Workflows, users, controls, integrations, and success measures"], ["02", "Validate commercials", "Final pricing, implementation fees, terms, and support"], ["03", "Run a focused pilot", "Representative users and measurable success criteria"], ["04", "Assess migration", "Data portability, security, training, ownership, and cutover"], ["05", "Record the decision", "Owner, status, rationale, and target review date"]].forEach(([number, heading, body], index) => {
    const col = index % 2; const row = Math.floor(index / 2); const x = 0.67 + col * 6.15; const y = 2.48 + row * 1.13;
    next.addText(number, { x, y, w: 0.55, h: 0.42, fontSize: 18, bold: true, color: "60A5FA", margin: 0 });
    next.addText(heading, { x: x + 0.72, y, w: 4.9, h: 0.26, fontSize: 12, bold: true, color: BRAND.white, margin: 0 });
    next.addText(body, { x: x + 0.72, y: y + 0.38, w: 4.95, h: 0.35, fontSize: 9, color: "CBD5E1", margin: 0, fit: "shrink" });
  });
  next.addText("Methodology: This report summarizes audit recommendations and user-provided software data. Cost figures are directional and should be validated with vendors. Recommendations do not replace security, legal, financial, or procurement review.", { x: 0.67, y: 6.35, w: 11.6, h: 0.35, fontSize: 7.5, color: "94A3B8", margin: 0, fit: "shrink" }); addFooter(next, page, true);
  await pptx.writeFile({ fileName: `${safeName(companyName)}_Stack_Sixth_Recommendation_Report.pptx` });
}