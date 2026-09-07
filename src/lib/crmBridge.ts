type CrmEvent = {
  type: string;
  data: Record<string, unknown>;
};

export async function notifyCrmEvent(event: CrmEvent): Promise<void> {
  const baseUrl = process.env.CRM_BRIDGE_URL;
  const token = process.env.CRM_BRIDGE_TOKEN;
  if (!baseUrl || !token) return;
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/events/pagefoundry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) console.error("CRM bridge rejected PageFoundry event", response.status);
  } catch (error) {
    console.error("CRM bridge event delivery failed", error);
  }
}
