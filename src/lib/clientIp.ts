export function clientIpFromForwardedFor(value: string | null): string {
  const chain = value
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  // nginx haengt die selbst beobachtete Remote-IP rechts an; vorangestellte
  // Client-Werte sind nicht vertrauenswuerdig.
  return chain?.at(-1) || "unknown";
}
