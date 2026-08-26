import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";

const normalize = (value = "") => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const money = (value) => value == null ? "Not provided" : `$${Number(value).toLocaleString()}/month`;
const fileName = (value = "recommendation") => value.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");

export function recommendationReportData(recommendation, existingSoftware = []) {
  const currentTool = existingSoftware.find((tool) => normalize(tool.name) === normalize(recommendation.replacement_candidate_for));
  const currentCost = currentTool?.monthly_cost ?? null;
  const recommendedCost = recommendation.estimated_monthly_cost ?? null;
  const difference = currentCost != null && recommendedCost != null ? currentCost - recommendedCost : null;
  return {
    currentTool: currentTool?.name || recommendation.replacement_candidate_for || "No current replacement identified",
    currentCost, recommendedCost, difference,
    recommendation: recommendation.name,
    category: recommendation.category || "Not provided",
    reasons: recommendation.why_it_fits || [],
    roi: recommendation.savings_or_roi_note || "ROI depends on final pricing and implementation scope.",
  };
}

export function exportRecommendationCsv(recommendation, existingSoftware, companyName) {
  const data = recommendationReportData(recommendation, existingSoftware);
  const rows = [["Company", "Current tool", "Current monthly cost", "Recommendation", "Recommended monthly cost", "Monthly cost difference", "Why it fits", "ROI note"], [companyName, data.currentTool, data.currentCost ?? "", data.recommendation, data.recommendedCost ?? "", data.difference ?? "", data.reasons.join("; "), data.roi]];
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = `${fileName(data.recommendation)}_Cost_Report.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportRecommendationPdf(recommendation, existingSoftware, companyName) {
  const data = recommendationReportData(recommendation, existingSoftware);
  const doc = new jsPDF();
  doc.setFontSize(20); doc.text("Recommendation Cost Report", 18, 22);
  doc.setFontSize(10); doc.setTextColor(90); doc.text(companyName || "Stack Sixth audit", 18, 30);
  doc.setTextColor(20); doc.setFontSize(13); doc.text(`${data.currentTool} to ${data.recommendation}`, 18, 44);
  doc.setFontSize(11); doc.text(`Currently paid: ${money(data.currentCost)}`, 18, 56); doc.text(`Recommended cost: ${money(data.recommendedCost)}`, 18, 64);
  doc.text(`Monthly cost difference: ${data.difference == null ? "Not available" : money(data.difference)}`, 18, 72);
  doc.setFontSize(12); doc.text("Why it fits", 18, 88);
  doc.setFontSize(10); const reasons = data.reasons.length ? data.reasons.map((reason) => `• ${reason}`).join("\n") : "No fit reasons provided.";
  const reasonLines = doc.splitTextToSize(reasons, 174); doc.text(reasonLines, 18, 96);
  const roiY = Math.min(230, 104 + reasonLines.length * 5); doc.setFontSize(12); doc.text("ROI note", 18, roiY);
  doc.setFontSize(10); doc.text(doc.splitTextToSize(data.roi, 174), 18, roiY + 8);
  doc.save(`${fileName(data.recommendation)}_Cost_Report.pdf`);
}

export async function exportRecommendationPptx(recommendation, existingSoftware, companyName) {
  const data = recommendationReportData(recommendation, existingSoftware);
  const pptx = new PptxGenJS(); pptx.layout = "LAYOUT_WIDE";
  const slide = pptx.addSlide(); slide.background = { color: "F6F8FC" };
  slide.addText("Recommendation Cost Report", { x: 0.6, y: 0.35, w: 8, h: 0.5, fontSize: 24, bold: true, color: "0F172A" });
  slide.addText(companyName || "Stack Sixth audit", { x: 9.2, y: 0.42, w: 3.5, h: 0.3, fontSize: 11, color: "64748B", align: "right" });
  const metrics = [["Currently paid", money(data.currentCost)], ["Recommended cost", money(data.recommendedCost)], ["Monthly difference", data.difference == null ? "Not available" : money(data.difference)]];
  metrics.forEach(([label, value], index) => { const x = 0.6 + index * 4.15; slide.addShape(pptx.ShapeType.rect, { x, y: 1.2, w: 3.85, h: 1.25, fill: { color: "FFFFFF" }, line: { color: "DCE3EE" } }); slide.addText(value, { x: x + 0.2, y: 1.45, w: 3.45, h: 0.4, fontSize: 19, bold: true, color: "155EEF", align: "center" }); slide.addText(label, { x: x + 0.2, y: 1.92, w: 3.45, h: 0.25, fontSize: 10, color: "64748B", align: "center" }); });
  slide.addText(`${data.currentTool} to ${data.recommendation}`, { x: 0.6, y: 2.8, w: 12, h: 0.5, fontSize: 18, bold: true, color: "0F172A" });
  slide.addText("Why it fits", { x: 0.6, y: 3.5, w: 5.8, h: 0.3, fontSize: 13, bold: true, color: "0F172A" });
  slide.addText(data.reasons.length ? data.reasons.map((reason) => ({ text: reason, options: { bullet: true, breakLine: true } })) : "No fit reasons provided.", { x: 0.6, y: 3.9, w: 5.8, h: 2.2, fontSize: 12, color: "475569", breakLine: true, margin: 0.05 });
  slide.addShape(pptx.ShapeType.rect, { x: 6.8, y: 3.5, w: 5.9, h: 2.35, fill: { color: "EFF6FF" }, line: { color: "BFDBFE" } });
  slide.addText("ROI note", { x: 7.1, y: 3.8, w: 5.3, h: 0.3, fontSize: 13, bold: true, color: "155EEF" }); slide.addText(data.roi, { x: 7.1, y: 4.25, w: 5.3, h: 1.25, fontSize: 12, color: "0F172A", margin: 0 });
  await pptx.writeFile({ fileName: `${fileName(data.recommendation)}_Cost_Report.pptx` });
}