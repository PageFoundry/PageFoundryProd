import fs from "fs/promises";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface InvoiceInput {
  orderId: string;
  buyerEmail: string;
  productName: string;
  priceEuro: string;
  issuedAt: Date;
}

export async function generateInvoicePDF({
  orderId,
  buyerEmail,
  productName,
  priceEuro,
  issuedAt,
}: InvoiceInput): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const drawText = async (
    text: string,
    opts: {
      x: number;
      y: number;
      size?: number;
      bold?: boolean;
      color?: { r: number; g: number; b: number };
    }
  ) => {
    const font = await pdfDoc.embedFont(
      opts.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica
    );
    page.drawText(text, {
      x: opts.x,
      y: opts.y,
      size: opts.size ?? 12,
      font,
      color: opts.color ? rgb(opts.color.r, opts.color.g, opts.color.b) : rgb(0, 0, 0),
    });
  };

  const drawBox = (
    x: number,
    y: number,
    w: number,
    h: number,
    color: { r: number; g: number; b: number }
  ) => {
    page.drawRectangle({ x, y, width: w, height: h, color: rgb(color.r, color.g, color.b) });
  };

  // === LOGO mit PNG/JPG-Fallback ===
  const margin = 50;
  const logoX = margin;
  let logoH = 0;
  let logoY = 0;

  async function embedLogo() {
    const candidates = ["PAGEfoundry.png", "PAGEfoundry.jpg", "logo.png", "logo.jpg"];
    for (const name of candidates) {
      const p = path.join(process.cwd(), "public", name);
      try {
        await fs.access(p);
        const bytes = await fs.readFile(p);
        const img = name.endsWith(".png")
          ? await pdfDoc.embedPng(bytes)
          : await pdfDoc.embedJpg(bytes);
        const logoW = 120;
        const h = (img.height / img.width) * logoW;
        const y = height - margin - h - 10;
        page.drawImage(img, { x: logoX, y, width: logoW, height: h });
        logoH = h;
        logoY = y;
        return;
      } catch {
        // try next
      }
    }
    // Fallback ohne Bild
    logoH = 80;
    logoY = height - margin - logoH - 10;
  }
  await embedLogo();

  // === RECHNUNGS-INFOS BOX (kompakt, rechts) ===
  const metaBoxPadding = 12;
  const metaBoxH = 70;
  const metaBoxW = 220;
  const metaBoxX = width - metaBoxW - 50;
  const logoCenterY = logoY + logoH / 2;
  const metaBoxY = Math.max(logoCenterY - metaBoxH / 2, height - margin - metaBoxH - 10);

  drawBox(metaBoxX, metaBoxY, metaBoxW, metaBoxH, { r: 0.97, g: 0.97, b: 0.97 });

  await drawText("Rechnung", {
    x: metaBoxX + metaBoxPadding,
    y: metaBoxY + metaBoxH - 18,
    size: 12,
    bold: true,
  });

  // nur letzte 10 Stellen
  const shortId = orderId.slice(-10).toUpperCase();

  await drawText(`Nr: ${shortId}`, {
    x: metaBoxX + metaBoxPadding,
    y: metaBoxY + metaBoxH - 36,
    size: 10,
  });

  await drawText(`Datum: ${issuedAt.toISOString().split("T")[0]}`, {
    x: metaBoxX + metaBoxPadding,
    y: metaBoxY + metaBoxH - 52,
    size: 10,
  });

  // === ABSENDER / EMPFÄNGER ===
  const leftX = margin;
  const rightX = width / 2 + 20;
  const baseY = metaBoxY - 80;

  await drawText("Absender", { x: leftX, y: baseY, size: 11, bold: true });
  await drawText("PageFoundry", { x: leftX, y: baseY - 15 });
  await drawText("no-reply@pagefoundry.de", { x: leftX, y: baseY - 30 });
  await drawText("pagefoundry.de", { x: leftX, y: baseY - 45 });

  await drawText("Rechnung an", { x: rightX, y: baseY, size: 11, bold: true });
  await drawText(buyerEmail, { x: rightX, y: baseY - 15 });

  // === TABELLE ===
  const tableTop = baseY - 100;
  const tableW = width - margin * 2;
  const col1W = tableW * 0.7;
  const tableX = margin;
  const rowH = 25;

  drawBox(tableX, tableTop, tableW, rowH, { r: 0.93, g: 0.93, b: 0.93 });
  await drawText("Beschreibung", { x: tableX + 10, y: tableTop + 7, size: 10, bold: true });
  await drawText("Betrag (€)", { x: tableX + col1W + 10, y: tableTop + 7, size: 10, bold: true });

  const productY = tableTop - rowH;
  await drawText(productName, { x: tableX + 10, y: productY + 7, size: 10 });
  await drawText(`€${priceEuro}`, { x: tableX + col1W + 10, y: productY + 7, size: 10 });

  const totalY = productY - rowH - 10;
  await drawText("Gesamt:", { x: tableX + col1W + 10, y: totalY + 10, size: 11, bold: true });
  await drawText(`€${priceEuro}`, { x: tableX + col1W + 60, y: totalY + 10, size: 11, bold: true });

  // === Fußtext ===
  const footerY = totalY - 60;
  await drawText("Dieses Dokument bestätigt den Kauf bei PageFoundry.", {
    x: margin,
    y: footerY,
    size: 9,
  });
  await drawText("Bei Fragen antworte bitte auf diese E-Mail.", {
    x: margin,
    y: footerY - 14,
    size: 9,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

type ServiceInvoicePdfInput = {
  number: string;
  issueDate: Date;
  dueDate: Date;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  notes: string | null;
  servicePeriodStart: Date | null;
  servicePeriodEnd: Date | null;
  client: {
    name: string;
    companyName: string | null;
    billingName: string | null;
    billingAddressLine1: string | null;
    billingAddressLine2: string | null;
    postalCode: string | null;
    city: string | null;
    country: string;
    vatId: string | null;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    taxRateBps: number;
    lineNetCents: number;
    lineTaxCents: number;
    lineGrossCents: number;
  }>;
};

function pdfMoney(cents: number) {
  return `${(cents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EUR`;
}

function pdfDate(date: Date) {
  return date.toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function normalizePdfText(text: string) {
  return text.replace(/€/g, "EUR").replace(/[–—]/g, "-");
}

export async function generateServiceInvoicePDF(invoice: ServiceInvoicePdfInput): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  const accent = rgb(0.79, 0.66, 0.3);
  const dark = rgb(0.08, 0.08, 0.08);
  const muted = rgb(0.36, 0.36, 0.36);
  const light = rgb(0.95, 0.95, 0.93);
  const issuerName = "Fabian Franke";
  const issuerIban = "DE26 3705 0299 0000 4213 13";
  // leer bis Gewerbe angemeldet ist; danach Finanzamt-Steuernummer eintragen
  const issuerTaxNumber = "";

  function text(value: string, x: number, y: number, size = 10, isBold = false, color = dark) {
    page.drawText(normalizePdfText(value), {
      x,
      y,
      size,
      font: isBold ? bold : regular,
      color,
    });
  }

  function right(value: string, x: number, y: number, size = 10, isBold = false) {
    const font = isBold ? bold : regular;
    const normalized = normalizePdfText(value);
    page.drawText(normalized, {
      x: x - font.widthOfTextAtSize(normalized, size),
      y,
      size,
      font,
      color: dark,
    });
  }

  function lines(value: string, maxChars = 72) {
    const words = normalizePdfText(value).split(/\s+/).filter(Boolean);
    const output: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        output.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) output.push(line);
    return output;
  }

  let logo: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  try {
    const logoBytes = await fs.readFile(path.join(process.cwd(), "public", "PAGEfoundry.png"));
    logo = await pdfDoc.embedPng(logoBytes);
  } catch {
    logo = null;
  }

  page.drawRectangle({ x: 0, y: height - 92, width, height: 92, color: rgb(0, 0, 0) });
  page.drawRectangle({ x: 0, y: height - 93, width, height: 1, color: accent });
  if (logo) {
    const logoH = 60;
    const logoW = (logo.width / logo.height) * logoH;
    page.drawImage(logo, { x: margin, y: height - 46 - logoH / 2, width: logoW, height: logoH });
    text("Webdesign, Automatisierung und digitale Services", margin + logoW + 14, height - 50, 9, false, rgb(0.82, 0.82, 0.78));
  } else {
    text("Pagefoundry", margin, height - 48, 22, true, rgb(1, 1, 1));
    text("Webdesign, Automatisierung und digitale Services", margin, height - 66, 9, false, rgb(0.82, 0.82, 0.78));
  }
  text("RECHNUNG", width - 182, height - 44, 18, true, accent);
  text(invoice.number, width - 182, height - 62, 10, false, rgb(1, 1, 1));

  const client = invoice.client;
  const recipient = [
    client.billingName ?? client.companyName ?? client.name,
    client.billingAddressLine1,
    client.billingAddressLine2,
    [client.postalCode, client.city].filter(Boolean).join(" "),
    client.country && client.country !== "DE" ? client.country : null,
  ].filter(Boolean) as string[];

  text("Pagefoundry · Kastanienweg 20a · 42499 Hueckeswagen", margin, height - 125, 7, false, muted);
  let y = height - 154;
  recipient.forEach((line, index) => {
    text(line, margin, y - index * 14, 10, index === 0);
  });
  if (client.vatId) text(`USt-Id: ${client.vatId}`, margin, y - recipient.length * 14 - 4, 9, false, muted);

  const servicePeriodText = (() => {
    const s = invoice.servicePeriodStart;
    const e = invoice.servicePeriodEnd;
    if (s && e) return s.getTime() === e.getTime() ? pdfDate(s) : `${pdfDate(s)} - ${pdfDate(e)}`;
    if (s) return pdfDate(s);
    if (e) return pdfDate(e);
    return pdfDate(invoice.issueDate);
  })();
  const servicePeriodLabel = invoice.servicePeriodStart || invoice.servicePeriodEnd ? "Leistungszeitraum" : "Leistungsdatum";
  text(servicePeriodLabel, margin, height - 232, 8, false, muted);
  text(servicePeriodText, margin, height - 246, 10);

  const metaX = width - 220;
  page.drawRectangle({ x: metaX, y: height - 214, width: 170, height: 86, color: light });
  text("Rechnungsdatum", metaX + 14, height - 152, 8, false, muted);
  right(pdfDate(invoice.issueDate), metaX + 156, height - 152, 9, true);
  text("Faellig bis", metaX + 14, height - 174, 8, false, muted);
  right(pdfDate(invoice.dueDate), metaX + 156, height - 174, 9, true);
  text("Gesamt", metaX + 14, height - 196, 8, false, muted);
  right(pdfMoney(invoice.totalCents), metaX + 156, height - 196, 10, true);

  const noVat = invoice.taxCents === 0;
  const colNet = width - 215;
  const colTax = width - 135;
  const colGross = width - margin;
  y = height - 275;
  text("Leistung", margin, y, 9, true);
  if (noVat) {
    right("Betrag", colGross, y, 9, true);
  } else {
    right("Netto", colNet, y, 9, true);
    right("USt", colTax, y, 9, true);
    right("Brutto", colGross, y, 9, true);
  }
  page.drawLine({ start: { x: margin, y: y - 8 }, end: { x: width - margin, y: y - 8 }, thickness: 1, color: accent });
  y -= 28;

  for (const item of invoice.items) {
    const itemLines = lines(item.description, 42);
    text(itemLines[0] ?? item.description, margin, y, 10, true);
    if (item.quantity > 1) text(`${item.quantity} x ${pdfMoney(item.unitPriceCents)}`, margin, y - 13, 8, false, muted);
    itemLines.slice(1, 3).forEach((line, index) => text(line, margin, y - 14 - index * 11, 8, false, muted));
    if (noVat) {
      right(pdfMoney(item.lineGrossCents), colGross, y, 9, true);
    } else {
      right(pdfMoney(item.lineNetCents), colNet, y, 9);
      right(`${(item.taxRateBps / 100).toLocaleString("de-DE")} %`, colTax, y, 9);
      right(pdfMoney(item.lineGrossCents), colGross, y, 9, true);
    }
    y -= Math.max(38, 22 + itemLines.slice(1, 3).length * 11);
  }

  page.drawLine({ start: { x: width - 260, y: y + 8 }, end: { x: width - margin, y: y + 8 }, thickness: 0.5, color: muted });
  if (noVat) {
    text("Gesamtbetrag", width - 260, y - 8, 11, true);
    right(pdfMoney(invoice.totalCents), width - margin, y - 8, 11, true);
    text("Gemaess Paragraph 19 UStG wird keine Umsatzsteuer berechnet.", margin, y - 8, 8, false, muted);
  } else {
    text("Zwischensumme", width - 260, y - 8, 9, false, muted);
    right(pdfMoney(invoice.subtotalCents), width - margin, y - 8, 9);
    text("Umsatzsteuer", width - 260, y - 28, 9, false, muted);
    right(pdfMoney(invoice.taxCents), width - margin, y - 28, 9);
    text("Gesamtbetrag", width - 260, y - 54, 11, true);
    right(pdfMoney(invoice.totalCents), width - margin, y - 54, 11, true);
  }

  const footerY = 78;
  let fy = footerY + 52;
  text("Zahlbar per Ueberweisung. Bitte die Rechnungsnummer als Verwendungszweck angeben.", margin, fy, 9, false, muted);
  fy -= 13;
  text(`Bankverbindung: ${issuerName} · IBAN ${issuerIban}`, margin, fy, 9, false, muted);
  if (issuerTaxNumber) {
    fy -= 13;
    text(`Steuernummer: ${issuerTaxNumber}`, margin, fy, 9, false, muted);
  }
  if (invoice.notes) {
    fy -= 16;
    lines(invoice.notes, 92)
      .slice(0, 2)
      .forEach((line, index) => text(line, margin, fy - index * 11, 8, false, muted));
  }
  text(`Pagefoundry · ${issuerName} · Kastanienweg 20a · 42499 Hueckeswagen · pagefoundry.de`, margin, footerY - 10, 7, false, muted);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
