export type ICSInput = {
  uid: string;
  summary: string;
  description?: string;
  startLocal: Date;   // Europe/Berlin "Wandzeit"
  endLocal: Date;     // Europe/Berlin "Wandzeit"
  url?: string;
  organizer?: string;
  attendeeEmail?: string;
  location?: string;
  tzid?: string;      // default Europe/Berlin
};

function ymdHMSInTz(d: Date, tz: string) {
  const s = d.toLocaleString('sv-SE', { timeZone: tz });
  const [datePart, timePart] = s.split(' ');
  const [Y, M, D] = datePart.split('-').map(Number);
  const [h, m, sec] = timePart.split(':').map(Number);
  const pad = (n:number)=> String(n).padStart(2,'0');
  return `${Y}${pad(M)}${pad(D)}T${pad(h)}${pad(m)}${pad(sec)}`;
}

export function buildICS({
  uid, summary, description = '',
  startLocal, endLocal, url, organizer = 'mailto:no-reply@pagefoundry.de',
  attendeeEmail, location = 'Online (Zoom) – MEZ', tzid = 'Europe/Berlin',
}: ICSInput) {
  const DTSTART = `DTSTART;TZID=${tzid}:${ymdHMSInTz(startLocal, tzid)}`;
  const DTEND   = `DTEND;TZID=${tzid}:${ymdHMSInTz(endLocal, tzid)}`;
  const attendee = attendeeEmail
    ? `ATTENDEE;CN=${attendeeEmail};ROLE=REQ-PARTICIPANT:mailto:${attendeeEmail}`
    : '';

  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PageFoundry//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VTIMEZONE
TZID:${tzid}
X-LIC-LOCATION:${tzid}
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:${uid}
SUMMARY:${summary}
DESCRIPTION:${description.replace(/\n/g,'\\n')}
${DTSTART}
${DTEND}
URL:${url ?? ''}
ORGANIZER;CN=PageFoundry:${organizer}
${attendee}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;

  return {
    filename: 'consultation.ics',
    content: Buffer.from(ics, 'utf8'),
    contentType: 'text/calendar; charset=utf-8',
  };
}
