import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";
import { recommendationReportData } from "@/utils/exportRecommendationReport";

const money = (value) => value == null ? "Not provided" : `$${Number(value).toLocaleString()}/month`;
const safeName = (value = "Stack_Sixth") => value.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
const reports = (recommendations, existingSoftware) => recommendations.map((rec) => recommendationReportData(rec, existingSoftware));

export function exportAllRecommendationsCsv(recommendations, existingSoftware, companyName) {
  const rows = [["Company", "Current tool", "Current monthly cost", "Recommendation", "Recommended monthly cost", "Monthly cost difference", "Why it fits", "ROI note"]];
  reports(recommendations, existingSoftware).forEach((item) => rows.push([companyName, item.currentTool, item.currentCost ?? "", item.recommendation, item.recommendedCost ?? "", item.difference ?? "", item.reasons.join("; "), item.roi]));
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = `${safeName(companyName)}_All_Recommendation_Reports.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportAllRecommendationsPdf(recommendations, existingSoftware, companyName) {
  const doc = new jsPDF();
  doc.setFontSize(22); doc.text("Recommendation Cost Reports", 18, 24);
  doc.setFontSize(11); doc.setTextColor(90); doc.text(companyName || "Stack Sixth audit", 18, 34);
  doc.setTextColor(20); doc.setFontSize(12); doc.text(`${recommendations.length} recommendations`, 18, 48);
  reports(recommendations, existingSoftware).forEach((item, index) => {
    doc.addPage(); doc.setFontSize(18); doc.text(`${index + 1}. ${item.recommendation}`, 18, 22);
    doc.setFontSize(10); doc.setTextColor(90); doc.text(item.category, 18, 30); doc.setTextColor(20);
    doc.setFontSize(11); doc.text(`Current tool: ${item.currentTool}`, 18, 44); doc.text(`Currently paid: ${money(item.currentCost)}`, 18, 53);
    doc.text(`Recommended cost: ${money(item.recommendedCost)}`, 18, 62); doc.text(`Monthly cost difference: ${item.difference == null ? "Not available" : money(item.difference)}`, 18, 71);
    doc.setFontSize(12); doc.text("Why it fits", 18, 88); doc.setFontSize(10);
    const reasonText = item.reasons.length ? item.reasons.map((reason) => `• ${reason}`).join("\n") : "No fit reasons provided.";
    const reasonLines = doc.splitTextToSize(reasonText, 174); doc.text(reasonLines, 18, 97);
    const roiY = Math.min(230, 106 + reasonLines.length * 5); doc.setFontSize(12); doc.text("ROI note", 18, roiY);
    doc.setFontSize(10); doc.text(doc.splitTextToSize(item.roi, 174), 18, roiY + 8);
  });
  doc.save(`${safeName(companyName)}_All_Recommendation_Reports.pdf`);
}

export async function exportAllRecommendationsPptx(recommendations, existingSoftware, companyName) {
  const pptx = new PptxGenJS(); pptx.layout = "LAYOUT_WIDE";
  const title = pptx.addSlide(); title.background = { color: "155EEF" };
  title.addText("Recommendation Cost Reports", { x: 0.7, y: 2.2, w: 12, h: 0.8, fontSize: 34, bold: true, color: "FFFFFF" });
  title.addText(`${companyName || "Stack Sixth audit"}  |  ${recommendations.length} recommendations`, { x: 0.7, y: 3.2, w: 12, h: 0.5, fontSize: 17, color: "DBEAFE" });
  reports(recommendations, existingSoftware).forEach((item, index) => {
    const slide = pptx.addSlide(); slide.background = { color: "F6F8FC" };
    slide.addText(`${index + 1}. ${item.recommendation}`, { x: 0.6, y: 0.35, w: 8, h: 0.5, fontSize: 24, bold: true, color: "0F172A" });
    slide.addText(item.category, { x: 9.2, y: 0.42, w: 3.5, h: 0.3, fontSize: 11, color: "64748B", align: "right" });
    [["Currently paid", money(item.currentCost)], ["Recommended cost", money(item.recommendedCost)], ["Monthly difference", item.difference == null ? "Not available" : money(item.difference)]].forEach(([label, value], metricIndex) => {
      const x = 0.6 + metricIndex * 4.15; slide.addShape(pptx.ShapeType.rect, { x, y: 1.2, w: 3.85, h: 1.25, fill: { color: "FFFFFF" }, line: { color: "DCE3EE" } });
      slide.addText(value, { x: x + 0.2, y: 1.45, w: 3.45, h: 0.4, fontSize: 19, bold: true, color: "155EEF", align: "center" }); slide.addText(label, { x: x + 0.2, y: 1.92, w: 3.45, h: 0.25, fontSize: 10, color: "64748B", align: "center" });
    });
    slide.addText(`${item.currentTool} to ${item.recommendation}`, { x: 0.6, y: 2.8, w: 12, h: 0.5, fontSize: 18, bold: true, color: "0F172A" });
    slide.addText("Why it fits", { x: 0.6, y: 3.5, w: 5.8, h: 0.3, fontSize: 13, bold: true, color: "0F172A" });
    slide.addText(item.reasons.length ? item.reasons.map((reason) => ({ text: reason, options: { bullet: true, breakLine: true } })) : "No fit reasons provided.", { x: 0.6, y: 3.9, w: 5.8, h: 2.2, fontSize: 12, color: "475569", margin: 0.05 });
    slide.addShape(pptx.ShapeType.rect, { x: 6.8, y: 3.5, w: 5.9, h: 2.35, fill: { color: "EFF6FF" }, line: { color: "BFDBFE" } }); slide.addText("ROI note", { x: 7.1, y: 3.8, w: 5.3, h: 0.3, fontSize: 13, bold: true, color: "155EEF" }); slide.addText(item.roi, { x: 7.1, y: 4.25, w: 5.3, h: 1.25, fontSize: 12, color: "0F172A", margin: 0 });
  });
  await pptx.writeFile({ fileName: `${safeName(companyName)}_All_Recommendation_Reports.pptx` });
}