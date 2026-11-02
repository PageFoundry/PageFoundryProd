import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { JwtPayload } from "@/lib/auth";
import { sendMail } from "@/lib/email";
import { normalizeHost } from "./leads";
import { referralLink, SITE_URL } from "./kit";
import { nextWorkdayMorning } from "./callGuide";

// Demo-Ablauf:
//   Connor protokolliert "Demo vereinbart" (mit E-Mail + Briefing) -> DemoRequest REQUESTED
//   -> Fabian bekommt Mail + Discord -> baut Demo -> traegt Link ein (READY)
//   -> Connor bekommt Mail + sieht Link im Portal -> sendet an Kunden (SENT).
// Der Kunde hat am Telefon ausdruecklich um die Demo per E-Mail gebeten (keine Kaltmail).

export class DemoError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function discord(content: string) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: content.slice(0, 1900) }) });
  } catch {
    // Benachrichtigung darf den Ablauf nie blockieren.
  }
}

export const demoSelect = {
  id: true, state: true, packageInterest: true, briefing: true, customerEmail: true, meetingAt: true, demoUrl: true,
  adminNote: true, sentMessage: true, readyAt: true, sentAt: true, createdAt: true, updatedAt: true,
  salesLead: { select: { id: true, companyName: true, contactName: true, phone: true, website: true, status: true } },
  requestedBy: { select: { id: true, email: true, name: true } },
} satisfies Prisma.DemoRequestSelect;

/** Wird innerhalb der Log-Transaktion aufgerufen. Max. eine aktive Anfrage pro Lead. */
export async function createDemoRequestTx(
  tx: Prisma.TransactionClient,
  data: { salesLeadId: string; requestedById: string; customerEmail: string; briefing: string; packageInterest?: string; meetingAt?: Date }
) {
  const active = await tx.demoRequest.findFirst({
    where: { salesLeadId: data.salesLeadId, state: { in: ["REQUESTED", "IN_PROGRESS", "READY"] } },
    select: { id: true },
  });
  if (active) {
    await tx.demoRequest.update({ where: { id: active.id }, data: { briefing: data.briefing, customerEmail: data.customerEmail } });
    return { id: active.id, created: false };
  }
  const r = await tx.demoRequest.create({ data, select: { id: true } });
  return { id: r.id, created: true };
}

/** Nach dem Commit: Fabian informieren. */
export async function notifyDemoRequested(id: string) {
  const d = await prisma.demoRequest.findUnique({ where: { id }, select: demoSelect });
  if (!d) return;
  const admin = process.env.CONSULTATION_ADMIN_EMAIL || "admin@pagefoundry.de";
  const who = d.requestedBy.name || d.requestedBy.email;
  const link = `${SITE_URL}/sales?tab=demos`;
  await sendMail({
    to: admin,
    subject: `Neue Demo-Anfrage: ${d.salesLead.companyName} (${who})`,
    text: `${who} hat eine Demo für ${d.salesLead.companyName} angefragt.\n\nPaket-Interesse: ${d.packageInterest || "unklar"}\nKunde: ${d.salesLead.contactName || "-"}, ${d.customerEmail}, ${d.salesLead.phone || "-"}\nWebsite: ${d.salesLead.website || "-"}\n\nBriefing:\n${d.briefing}\n\nDemo-Link eintragen: ${link}`,
    html: `<p><b>${esc(who)}</b> hat eine Demo für <b>${esc(d.salesLead.companyName)}</b> angefragt.</p><p>Paket-Interesse: ${esc(d.packageInterest || "unklar")}<br>Kunde: ${esc(d.salesLead.contactName || "-")}, ${esc(d.customerEmail)}, ${esc(d.salesLead.phone || "-")}<br>Website: ${esc(d.salesLead.website || "-")}</p><p><b>Briefing</b><br>${esc(d.briefing).replace(/\n/g, "<br>")}</p><p><a href="${link}">Demo-Link eintragen</a></p>`,
  }).catch((err) => console.error("[sales/demo] admin mail failed", err));
  await discord(`🎨 Neue Demo-Anfrage von ${who}: **${d.salesLead.companyName}** (${d.packageInterest || "Paket unklar"})\n${d.briefing.slice(0, 600)}\n${link}`);
}

export async function listDemos(actor: JwtPayload) {
  return prisma.demoRequest.findMany({
    where: actor.role === "ADMIN" ? {} : { requestedById: actor.sub },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: demoSelect,
  });
}

export const adminDemoSchema = z.object({
  state: z.enum(["IN_PROGRESS", "READY", "CANCELLED"]),
  demoUrl: z.string().trim().max(512).optional(),
  adminNote: z.string().trim().max(4000).optional(),
});

/** Nur ADMIN: Status setzen, Demo-Link eintragen. READY braucht einen https-Link. */
export async function adminUpdateDemo(actor: JwtPayload, id: string, input: z.infer<typeof adminDemoSchema>) {
  if (actor.role !== "ADMIN") throw new DemoError(403, "Nur der Admin pflegt Demo-Links.");
  const d = await prisma.demoRequest.findUnique({ where: { id }, select: { id: true, state: true } });
  if (!d) throw new DemoError(404, "Demo-Anfrage nicht gefunden.");
  if (d.state === "SENT") throw new DemoError(409, "Demo wurde bereits an den Kunden geschickt.");
  let demoUrl: string | undefined;
  if (input.state === "READY") {
    const u = (input.demoUrl || "").trim();
    if (!/^https:\/\//i.test(u) || !normalizeHost(u)) throw new DemoError(400, "Bitte einen vollständigen https-Link zur Demo eintragen.");
    demoUrl = u;
  }
  const res = await prisma.demoRequest.updateMany({
    where: { id, state: d.state },
    data: {
      state: input.state,
      ...(demoUrl ? { demoUrl, readyAt: new Date() } : {}),
      ...(input.adminNote !== undefined ? { adminNote: input.adminNote || null } : {}),
    },
  });
  if (res.count !== 1) throw new DemoError(409, "Wurde zwischenzeitlich geändert, bitte neu laden.");
  const updated = await prisma.demoRequest.findUniqueOrThrow({ where: { id }, select: demoSelect });
  if (input.state === "READY") {
    await sendMail({
      to: updated.requestedBy.email,
      subject: `Demo fertig: ${updated.salesLead.companyName}`,
      text: `Die Demo für ${updated.salesLead.companyName} ist fertig:\n${updated.demoUrl}\n\nIm Sales-Portal unter „Demos" kannst du sie direkt an ${updated.customerEmail} schicken.\n${SITE_URL}/sales?tab=demos`,
      html: `<p>Die Demo für <b>${esc(updated.salesLead.companyName)}</b> ist fertig:<br><a href="${esc(updated.demoUrl!)}">${esc(updated.demoUrl!)}</a></p><p>Im <a href="${SITE_URL}/sales?tab=demos">Sales-Portal unter „Demos"</a> kannst du sie direkt an ${esc(updated.customerEmail)} schicken.</p>`,
    }).catch((err) => console.error("[sales/demo] rep mail failed", err));
  }
  return updated;
}

/** Standardtext fuer die Demo-Mail an den Kunden (im Portal editierbar). */
export function defaultDemoMessage(d: { salesLead: { companyName: string; contactName: string | null }; demoUrl: string | null }, rep: { name: string | null; email: string; referralCode: string | null }) {
  const anrede = d.salesLead.contactName ? `Guten Tag ${d.salesLead.contactName},` : "Guten Tag,";
  const repName = rep.name || "Ihr PageFoundry-Team";
  const termin = rep.referralCode ? referralLink(rep.referralCode) : `${SITE_URL}/consultation`;
  return `${anrede}

vielen Dank für das nette Gespräch. Wie besprochen haben wir für ${d.salesLead.companyName} eine kostenlose Demo-Seite erstellt:

${d.demoUrl}

Die Demo ist unverbindlich und zeigt, wie Ihre Website bei uns aussehen könnte. Texte und Bilder passen wir natürlich an Ihren Betrieb an.

Wenn Sie die Demo gemeinsam durchgehen möchten, können Sie hier direkt einen Termin wählen:
${termin}

Oder antworten Sie einfach auf diese E-Mail.

Viele Grüße
${repName}
PageFoundry · pagefoundry.de`;
}

export const sendDemoSchema = z.object({ message: z.string().trim().min(40).max(6000) });

/** Nur der anfragende Verkaeufer: Demo-Link an den Kunden schicken (einmalig). */
export async function sendDemoToCustomer(actor: JwtPayload, id: string, message: string) {
  if (actor.role !== "SALES") throw new DemoError(403, "Nur Vertriebs-Konten versenden Demos.");
  const d = await prisma.demoRequest.findUnique({ where: { id }, select: { ...demoSelect, requestedById: true } });
  if (!d || d.requestedById !== actor.sub) throw new DemoError(404, "Demo-Anfrage nicht gefunden.");
  if (d.state !== "READY" || !d.demoUrl) throw new DemoError(409, "Die Demo ist noch nicht fertig.");
  if (!message.includes(d.demoUrl)) throw new DemoError(400, "Der Demo-Link muss in der Nachricht stehen.");
  // Werbewiderspruch seit der Anfrage? Dann nicht senden.
  const lead = await prisma.salesLead.findUniqueOrThrow({ where: { id: d.salesLead.id }, select: { phoneNorm: true, emailNorm: true, websiteHost: true } });
  const or: Prisma.CallBlockWhereInput[] = [];
  if (lead.phoneNorm) or.push({ phoneNorm: lead.phoneNorm });
  if (lead.emailNorm) or.push({ emailNorm: lead.emailNorm });
  if (lead.websiteHost) or.push({ websiteHost: lead.websiteHost });
  or.push({ emailNorm: d.customerEmail.toLowerCase() });
  if (await prisma.callBlock.findFirst({ where: { OR: or }, select: { id: true } })) throw new DemoError(409, "Kontakt steht auf der Sperrliste – kein Versand.");

  // Erst Status sichern (verhindert Doppelversand), dann senden; bei Fehler zuruecksetzen.
  const claimed = await prisma.demoRequest.updateMany({ where: { id, state: "READY" }, data: { state: "SENT", sentAt: new Date(), sentMessage: message } });
  if (claimed.count !== 1) throw new DemoError(409, "Wurde bereits versendet.");
  const rep = d.requestedBy;
  try {
    const info = await sendMail({
      to: d.customerEmail,
      replyTo: rep.email,
      subject: `Ihre Demo-Website von PageFoundry – ${d.salesLead.companyName}`,
      text: message,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">${esc(message).replace(/\n/g, "<br>").replace(esc(d.demoUrl), `<a href="${esc(d.demoUrl)}">${esc(d.demoUrl)}</a>`)}</div>`,
    });
    if ((info as { messageId?: string }).messageId === "email-disabled") {
      await prisma.demoRequest.update({ where: { id }, data: { state: "READY", sentAt: null } });
      throw new DemoError(503, "E-Mail-Versand ist auf diesem Server deaktiviert.");
    }
  } catch (err) {
    if (err instanceof DemoError) throw err;
    await prisma.demoRequest.update({ where: { id }, data: { state: "READY", sentAt: null } });
    console.error("[sales/demo] customer mail failed", err);
    throw new DemoError(502, "Versand fehlgeschlagen – bitte später erneut versuchen.");
  }
  // Nachfassen automatisch einplanen: Rueckruf in drei Werktagen. Unter Lead-Lock und nur,
  // wenn die Wiedervorlage nicht abgebrochen ist (z. B. falsche Nummer, Widerspruch).
  let followUp = new Date();
  for (let i = 0; i < 3; i++) followUp = nextWorkdayMorning(followUp);
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "SalesLead" WHERE id = ${d.salesLead.id} FOR UPDATE`;
    const lead = await tx.salesLead.findUniqueOrThrow({ where: { id: d.salesLead.id }, select: { status: true } });
    if (lead.status === "WON" || lead.status === "LOST") return;
    const updated = await tx.callTask.updateMany({
      where: { salesLeadId: d.salesLead.id, state: { not: "CANCELLED" } },
      data: { kind: "CALLBACK", nextAttemptAt: followUp, failedAttempts: 0, state: "OPEN" },
    });
    if (updated.count === 0 && !(await tx.callTask.findUnique({ where: { salesLeadId: d.salesLead.id }, select: { id: true } }))) {
      await tx.callTask.create({ data: { salesLeadId: d.salesLead.id, ownerId: actor.sub, kind: "CALLBACK", nextAttemptAt: followUp, failedAttempts: 0, state: "OPEN" } });
    }
  });
  return prisma.demoRequest.findUniqueOrThrow({ where: { id }, select: demoSelect });
}
