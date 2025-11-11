import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { buildICS } from "@/lib/ics";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";

type Slot =
  | "MON_12_14" | "MON_14_16" | "MON_16_18" | "MON_18_20"
  | "TUE_12_14" | "TUE_14_16" | "TUE_16_18" | "TUE_18_20"
  | "WED_12_14" | "WED_14_16" | "WED_16_18" | "WED_18_20";

const ZOOM_STATIC_URL = process.env.ZOOM_STATIC_URL || "https://zoom.us/j/8237741561";
const ADMIN = process.env.CONSULTATION_ADMIN_EMAIL || "admin@pagefoundry.de";

const slotMap: Record<Slot, { weekday: number; start: number; end: number; pretty: string }> = {
  MON_12_14:{weekday:1,start:12,end:14,pretty:"Mon 12–14"},
  MON_14_16:{weekday:1,start:14,end:16,pretty:"Mon 14–16"},
  MON_16_18:{weekday:1,start:16,end:18,pretty:"Mon 16–18"},
  MON_18_20:{weekday:1,start:18,end:20,pretty:"Mon 18–20"},
  TUE_12_14:{weekday:2,start:12,end:14,pretty:"Tue 12–14"},
  TUE_14_16:{weekday:2,start:14,end:16,pretty:"Tue 14–16"},
  TUE_16_18:{weekday:2,start:16,end:18,pretty:"Tue 16–18"},
  TUE_18_20:{weekday:2,start:18,end:20,pretty:"Tue 18–20"},
  WED_12_14:{weekday:3,start:12,end:14,pretty:"Wed 12–14"},
  WED_14_16:{weekday:3,start:14,end:16,pretty:"Wed 14–16"},
  WED_16_18:{weekday:3,start:16,end:18,pretty:"Wed 16–18"},
  WED_18_20:{weekday:3,start:18,end:20,pretty:"Wed 18–20"},
};

// Nächster Slot als echte "Wandzeit" Europe/Berlin, ohne UTC-Konvertierung
function nextOccurrenceInBerlinLocal(weekday: number, startHour: number, endHour: number) {
  const tz = "Europe/Berlin";
  const now = new Date();
  const s = now.toLocaleString("sv-SE", { timeZone: tz });
  const [datePart] = s.split(" ");
  const [Y,M,D] = datePart.split("-").map(Number);
  const base = new Date(Date.UTC(Y, M-1, D, 0, 0, 0));

  const dowStr = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: tz }).format(base);
  const map:{[k:string]:number}={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  const today = map[dowStr];
  const target = weekday % 7;

  let addDays = target - today;
  if (addDays < 0) addDays += 7;

  const mkLocal = (h:number) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + addDays);
    // Zeitstempel so setzen, dass lokale Anzeige in Berlin h:00 ist
    const localStr = d.toLocaleString("sv-SE", { timeZone: tz });
    const [date2] = localStr.split(" ");
    const [y,m,da] = date2.split("-").map(Number);
    return new Date(Date.UTC(y, m-1, da, h, 0, 0));
  };

  let startLocal = mkLocal(startHour);
  let endLocal   = mkLocal(endHour);

  // wenn heute und Start schon vorbei (lokal), schiebe um 7 Tage
  const hn = Number(now.toLocaleString("sv-SE", { timeZone: tz }).split(" ")[1].slice(0,2));
  if (addDays === 0 && hn >= startHour) {
    startLocal.setUTCDate(startLocal.getUTCDate() + 7);
    endLocal.setUTCDate(endLocal.getUTCDate() + 7);
  }
  return { startLocal, endLocal };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, phone, preferredTime, note } = body || {};
    if (!preferredTime || !(preferredTime in slotMap)) {
      return NextResponse.json({ message: "preferredTime missing/invalid" }, { status: 400 });
    }

    // Auth aus Cookie → Email aus DB
    const store = await cookies();
    const token = store.get("token")?.value;
    let authedUserId: string | null = null;
    let authedEmail: string | null = null;

    if (token) {
      let payload: any = null;
      try { payload = verifyJwt(token); } catch {}
      authedUserId = payload?.userId ?? null;
      if (authedUserId) {
        const user = await prisma.user.findFirst({ where: { id: authedUserId }, select: { email: true } });
        authedEmail = user?.email ?? null;
      }
    }

    const slot = slotMap[preferredTime as Slot];
    const when = nextOccurrenceInBerlinLocal(slot.weekday, slot.start, slot.end);

    // Anzeigezeit in MEZ
    const whenPretty =
      new Intl.DateTimeFormat("de-DE", {
        timeZone: "Europe/Berlin",
        weekday: "short", day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      }).format(when.startLocal) +
      " – " +
      new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" })
        .format(when.endLocal) +
      " (MEZ)";

    // persist
    const safeName = (name && String(name).trim()) || (authedEmail ?? "").split("@")[0] || "Guest";
    const rec = await prisma.consultationRequest.create({
      data: {
        userId: authedUserId,
        name: safeName,
        phone: phone ? String(phone) : "",
        preferredTime: preferredTime as any,
        note: note ? String(note) : "",
      }
    });

    // ICS bauen (lokale Zeiten, Europe/Berlin)
    const ics = buildICS({
      uid: `consultation-${rec.id}@pagefoundry.de`,
      summary: "Free Consultation · PageFoundry",
      description:
        `Your free consultation with PageFoundry.\n` +
        `Name: ${safeName}\nEmail: ${authedEmail ?? (email || "-")}\nPhone: ${phone || "-"}\nWhen: ${whenPretty}\n` +
        `Zoom: ${ZOOM_STATIC_URL}`,
      startLocal: when.startLocal,
      endLocal: when.endLocal,
      url: ZOOM_STATIC_URL,
      organizer: "mailto:no-reply@pagefoundry.de",
      attendeeEmail: authedEmail ?? (typeof email === "string" ? email : undefined),
      location: "Online (Zoom) – MEZ",
      tzid: "Europe/Berlin",
    });

    // Mail an Kunde, nur wenn wir eine Adresse haben
    const customerTo = authedEmail ?? (typeof email === "string" ? email.trim() : "");
    if (customerTo) {
      await sendMail({
        to: customerTo,
        subject: "Your Free Consultation · PageFoundry",
        text:
`Thanks for booking a free consultation.

Zoom: ${ZOOM_STATIC_URL}
When: ${whenPretty}

If the time does not fit, reply to this email.`,
        html:
`<p>Thanks for booking a free consultation.</p>
<p><b>Zoom:</b> <a href="${ZOOM_STATIC_URL}">${ZOOM_STATIC_URL}</a><br/>
<b>When:</b> ${whenPretty}</p>
<p>You will also find a calendar invitation attached.</p>`,
        attachments: [ics],
      });
    }

    // Mail an Admin
    await sendMail({
      to: ADMIN,
      subject: "New Consultation Request",
      text:
`Name: ${safeName}
Email: ${customerTo || "-"}
Phone: ${phone || "-"}
When: ${whenPretty}

Zoom: ${ZOOM_STATIC_URL}
`,
      html:
`<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif">
  <h3>New Consultation Request</h3>
  <ul>
    <li><b>Name:</b> ${safeName}</li>
    <li><b>Email:</b> ${customerTo || "-"}</li>
    <li><b>Phone:</b> ${phone || "-"}</li>
    <li><b>When:</b> ${whenPretty}</li>
  </ul>
  <p><b>Zoom:</b> <a href="${ZOOM_STATIC_URL}">${ZOOM_STATIC_URL}</a></p>
</div>`,
      attachments: [ics],
    });

    return NextResponse.json({ ok: true, id: rec.id });
  } catch (e) {
    console.error("consultation error", e);
    return NextResponse.json({ message: "server error" }, { status: 500 });
  }
}
