import dns from "node:dns";
import net from "node:net";

// SSRF-Schutz fuer den Website-Check der Anrufliste. Die URLs stammen aus fremden
// Daten (Leadfinder/OSM) und werden vom Prod-Server abgerufen. Deshalb:
//  - nur http/https, nur Standard-Ports, keine Zugangsdaten in der URL
//  - IP-Literale im Host werden direkt klassifiziert (dns.lookup wird dafuer nicht gefragt)
//  - Hostnamen: ALLE aufgeloesten Adressen muessen oeffentlich sein, und die Verbindung
//    nutzt genau die geprueften Adressen (Lookup-Funktion im Dispatcher, kein zweiter
//    DNS-Lookup -> kein Rebinding-Fenster)

function ipv4ToInt(a: string): number | null {
  const p = a.split(".");
  if (p.length !== 4) return null;
  let n = 0;
  for (const x of p) {
    if (!/^\d{1,3}$/.test(x)) return null;
    const v = Number(x);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

const V4_BLOCKS: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // Link-Local / Cloud-Metadaten
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4], // Multicast
  ["240.0.0.0", 4], // reserviert + Broadcast
];

function blockedV4(addr: string): boolean {
  const n = ipv4ToInt(addr);
  if (n === null) return true;
  return V4_BLOCKS.some(([base, bits]) => {
    const b = ipv4ToInt(base)!;
    const size = 2 ** (32 - bits);
    return n >= b && n < b + size;
  });
}

/** Expandiert eine IPv6-Adresse auf 8 Gruppen (Zahlen) oder null. */
function expandV6(addr: string): number[] | null {
  let a = addr.toLowerCase().split("%")[0];
  // eingebettete IPv4 am Ende (::ffff:1.2.3.4) -> in zwei Hex-Gruppen umschreiben
  const v4m = a.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4m) {
    const n = ipv4ToInt(v4m[1]);
    if (n === null) return null;
    a = a.slice(0, -v4m[1].length) + `${Math.floor(n / 65536).toString(16)}:${(n % 65536).toString(16)}`;
  }
  const parts = a.split("::");
  if (parts.length > 2) return null;
  const head = parts[0] ? parts[0].split(":") : [];
  const rest = parts.length === 2 && parts[1] ? parts[1].split(":") : [];
  const fill = parts.length === 2 ? 8 - head.length - rest.length : 0;
  if (fill < 0) return null;
  const groups = [...head, ...Array(fill).fill("0"), ...rest];
  if (groups.length !== 8) return null;
  const nums = groups.map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN));
  if (nums.some((x) => Number.isNaN(x))) return null;
  return nums;
}

function blockedV6(addr: string): boolean {
  const g = expandV6(addr);
  if (!g) return true;
  const allZeroUntil = (i: number) => g.slice(0, i).every((x) => x === 0);
  if (g.every((x) => x === 0)) return true; // ::
  if (allZeroUntil(7) && g[7] === 1) return true; // ::1
  // IPv4-mapped ::ffff:a.b.c.d und IPv4-kompatibel ::a.b.c.d -> wie IPv4 behandeln
  if (allZeroUntil(5) && (g[5] === 0xffff || g[5] === 0)) {
    const v4 = `${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`;
    return blockedV4(v4);
  }
  if (g[0] === 0x64 && g[1] === 0xff9b) return true; // NAT64
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 ULA
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 Link-Local
  if ((g[0] & 0xffc0) === 0xfec0) return true; // fec0::/10 Site-Local (alt)
  if ((g[0] & 0xff00) === 0xff00) return true; // Multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // Doku
  if (g[0] === 0x2001 && g[1] < 0x0200) return true; // 2001::/23 IETF (Teredo u. a.)
  if (g[0] === 0x2002) return true; // 6to4 (kann private IPv4 einbetten)
  return false;
}

/** true = Adresse darf NICHT kontaktiert werden. Unbekanntes Format -> blockiert. */
export function isBlockedAddress(address: string): boolean {
  const t = net.isIP(address);
  if (t === 4) return blockedV4(address);
  if (t === 6) return blockedV6(address);
  return true;
}

export class UnsafeTargetError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "UnsafeTargetError";
  }
}

/**
 * Prueft eine URL ohne Netzwerkzugriff. Wirft UnsafeTargetError.
 * Liefert die geparste URL zurueck.
 */
export function assertSafeUrlSyntax(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new UnsafeTargetError("invalid_url");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new UnsafeTargetError("bad_protocol");
  if (u.username || u.password) throw new UnsafeTargetError("credentials_in_url");
  if (u.port && !((u.protocol === "http:" && u.port === "80") || (u.protocol === "https:" && u.port === "443"))) {
    throw new UnsafeTargetError("bad_port");
  }
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase().replace(/\.$/, "");
  if (!host) throw new UnsafeTargetError("no_host");
  if (net.isIP(host)) {
    // IP-Literal: dns.lookup wuerde es ungeprueft durchreichen -> hier entscheiden.
    if (isBlockedAddress(host)) throw new UnsafeTargetError("blocked_ip_literal");
    return u;
  }
  if (!host.includes(".")) throw new UnsafeTargetError("single_label_host");
  if (/(^|\.)(localhost|local|internal|lan|home|corp|intranet)$/.test(host)) {
    throw new UnsafeTargetError("internal_tld");
  }
  // Ziffern-only-Hostnamen ("2130706433") oder Hex ("0x7f.1") koennen von Resolvern als IP gelesen werden.
  if (/^[0-9.]+$/.test(host) || /(^|\.)0x[0-9a-f]+/i.test(host)) throw new UnsafeTargetError("numeric_host");
  return u;
}

type LookupCb = (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void;

/**
 * Lookup-Funktion fuer den undici-Dispatcher: loest auf, verlangt dass ALLE Adressen
 * oeffentlich sind, und gibt nur diese an den Socket weiter.
 */
export function safeLookup(
  hostname: string,
  options: dns.LookupOptions | number | LookupCb,
  maybeCb?: LookupCb
): void {
  const cb = (typeof options === "function" ? options : maybeCb) as LookupCb;
  const opts = (typeof options === "object" && options) || {};
  const host = hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host)) {
    if (isBlockedAddress(host)) {
      cb(Object.assign(new Error("blocked_address"), { code: "EBLOCKED" }), "", 0);
      return;
    }
    const fam = net.isIP(host);
    if ((opts as dns.LookupOptions).all) cb(null, [{ address: host, family: fam }]);
    else cb(null, host, fam);
    return;
  }
  dns.lookup(host, { all: true, verbatim: true }, (err, addrs) => {
    if (err) return cb(err, "", 0);
    const list = (addrs as dns.LookupAddress[]) || [];
    if (!list.length) return cb(Object.assign(new Error("no_address"), { code: "ENOTFOUND" }), "", 0);
    if (list.some((a) => isBlockedAddress(a.address))) {
      return cb(Object.assign(new Error("blocked_address"), { code: "EBLOCKED" }), "", 0);
    }
    if ((opts as dns.LookupOptions).all) cb(null, list);
    else cb(null, list[0].address, list[0].family);
  });
}
