import fs from "fs";
import PDFDocument from "pdfkit";
import type { SocialAudit } from "./types";

const regularFont = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
const boldFont = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";

function formatScore(value: number | null | undefined, max: number) {
  if (value === null || value === undefined) return `0 / ${max}`;
  return `${value} / ${max}`;
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("de-DE").format(value ?? 0);
}

function addSection(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(1.2);
  doc.font("Bold").fontSize(13).fillColor("#111111").text(title);
  doc.moveDown(0.35);
  doc.strokeColor("#c9a84c").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.7);
}

function addRow(doc: PDFKit.PDFDocument, label: string, value: string) {
  const y = doc.y;
  doc.font("Bold").fontSize(9).fillColor("#555555").text(label, 50, y, { width: 170 });
  doc.font("Regular").fontSize(10).fillColor("#111111").text(value, 220, y, { width: 320 });
  doc.moveDown(0.6);
}

export async function generateSocialAuditPdf(audit: SocialAudit) {
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  const chunks: Buffer[] = [];

  if (fs.existsSync(regularFont)) doc.registerFont("Regular", regularFont);
  if (fs.existsSync(boldFont)) doc.registerFont("Bold", boldFont);

  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));

  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.rect(0, 0, 595, 110).fill("#050505");
  doc.font("Bold").fontSize(26).fillColor("#f0ede8").text("PF Social Audit", 50, 36);
  doc.font("Regular").fontSize(10).fillColor("#c9a84c").text("Internal PageFoundry lead qualification report", 50, 72);
  doc.moveDown(3.2);

  addSection(doc, "Company Information");
  addRow(doc, "Company", audit.companyName || "Unbekannt");
  addRow(doc, "Website", audit.website || "Nicht gefunden");
  addRow(doc, "Status", audit.status);
  addRow(doc, "Created", new Date(audit.createdAt).toLocaleString("de-DE"));

  addSection(doc, "Social Presence");
  addRow(doc, "Instagram", audit.instagramUrl || "-");
  addRow(doc, "Facebook", audit.facebookUrl || "-");
  addRow(doc, "TikTok", audit.tiktokUrl || "-");
  addRow(doc, "Followers", formatNumber(audit.followers));
  addRow(doc, "Posts", formatNumber(audit.posts));
  addRow(doc, "Average Likes", formatNumber(audit.avgLikes));
  addRow(doc, "Social Score", formatScore(audit.socialScore, 10));

  addSection(doc, "Website Health");
  addRow(doc, "Website Score", formatScore(audit.websiteScore, 10));
  addRow(doc, "Mobile Menu", audit.mobileMenuWorking ? "Working" : "Broken");
  addRow(doc, "Contact Form", audit.contactFormFound ? "Found" : "Missing");
  addRow(doc, "Clickable Phone", audit.phoneClickable ? "Found" : "Missing");
  addRow(doc, "Impressum", audit.impressumClickable ? "Accessible" : "Inaccessible");
  addRow(doc, "Privacy Policy", audit.privacyClickable ? "Accessible" : "Inaccessible");
  addRow(doc, "robots.txt", audit.robotsTxtFound ? "Found" : "Missing");
  addRow(doc, "sitemap.xml", audit.sitemapFound ? "Found" : "Missing");
  addRow(doc, "Elementor", audit.elementorDetected ? "Detected" : "Not detected");
  addRow(doc, "LCP", audit.lcp !== null ? `${audit.lcp}s` : "-");
  addRow(doc, "CLS", audit.cls !== null ? String(audit.cls) : "-");
  addRow(doc, "Load Time", audit.loadTime !== null ? `${audit.loadTime}s` : "-");

  addSection(doc, "Opportunity Score");
  doc.font("Bold").fontSize(24).fillColor("#111111").text(formatScore(audit.opportunityScore, 100));
  doc.moveDown(0.4);
  doc.font("Regular").fontSize(11).text(`Recommendation: ${audit.recommendation.label}`);
  doc.font("Regular").fontSize(11).text(`Suggested Time: ${audit.recommendation.suggestedTime}`);

  addSection(doc, "Detected Issues");
  const issues = audit.issues.length > 0 ? audit.issues : ["No critical issues detected"];
  for (const issue of issues) {
    doc.font("Regular").fontSize(10).fillColor("#111111").text(`❌ ${issue}`, { width: 500 });
    doc.moveDown(0.3);
  }

  addSection(doc, "PageFoundry Services");
  for (const service of audit.recommendation.services) {
    doc.font("Bold").fontSize(10).fillColor("#111111").text(`${service.name} · ${service.price}`);
    doc.font("Regular").fontSize(9).fillColor("#333333").text(service.fit, { width: 500 });
    doc.moveDown(0.6);
  }

  const pageRange = doc.bufferedPageRange();
  for (let index = pageRange.start; index < pageRange.start + pageRange.count; index += 1) {
    doc.switchToPage(index);
    doc.font("Regular").fontSize(8).fillColor("#777777").text(`Page ${index + 1}`, 50, 810, { align: "right", width: 495 });
  }

  doc.end();
  return done;
}
