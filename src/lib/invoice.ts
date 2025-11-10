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
