import { promises as fs } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import tls from "tls";

const execFileAsync = promisify(execFile);

type WebsiteTarget = {
  name: string;
  url: string;
  note: string;
  localPath: string | null;
  owner: "pagefoundry" | "customer";
  deployment: string;
  monitoring: "local_vps" | "external_http";
};

type ProcessSummary = {
  name: string;
  status: string;
  uptime: string;
  cpu: string;
  memoryMb: number | null;
};

type WebsiteStatus = {
  name: string;
  url: string;
  note: string;
  owner: "pagefoundry" | "customer";
  deployment: string;
  monitoring: "local_vps" | "external_http";
  httpStatus: number | null;
  ok: boolean;
  latencyMs: number | null;
  deployUpdatedAt: string | null;
  tlsValidTo: string | null;
  error: string | null;
};

type SystemStatus = {
  hostname: string;
  uptime: string;
  loadAverage: string;
  memory: {
    totalMb: number | null;
    usedMb: number | null;
    freeMb: number | null;
  };
  disk: {
    mount: string;
    size: string;
    used: string;
    available: string;
    usedPercent: string;
  } | null;
};

type InfraStatus = {
  nginx: string;
  postgres5432: boolean;
  cronEntries: string[];
};

export type AdminOverview = {
  generatedAt: string;
  system: SystemStatus;
  websites: WebsiteStatus[];
  processes: ProcessSummary[];
  infra: InfraStatus;
  opportunities: SupportOpportunity[];
};

export type SupportOpportunity = {
  id: string;
  scope: "website" | "system" | "process" | "infra";
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  target: string;
};

const WEBSITE_TARGETS: WebsiteTarget[] = [
  {
    name: "Pagefoundry",
    url: "https://pagefoundry.de",
    note: "Live-Marketingseite",
    localPath: "/var/www/pagefoundry",
    owner: "pagefoundry",
    deployment: "Dieser VPS · nginx -> pm2 pagefoundry",
    monitoring: "local_vps",
  },
  {
    name: "Leadfinder",
    url: "https://leads.pagefoundry.de/login",
    note: "Interne Lead-Recherche",
    localPath: "/home/ubuntu/restore/leadfinder/apps/web",
    owner: "pagefoundry",
    deployment: "Dieser VPS · nginx -> pm2 leadfinder",
    monitoring: "local_vps",
  },
  {
    name: "Outreach Demo",
    url: "https://demo.pagefoundry.de",
    note: "Demo- und Outreach-System",
    localPath: "/home/ubuntu/outreach-demo",
    owner: "pagefoundry",
    deployment: "Dieser VPS · nginx -> pm2 outreach-demo",
    monitoring: "local_vps",
  },
  {
    name: "CarbonCare Site",
    url: "https://carbon-care.de",
    note: "Kunden-Website",
    localPath: "/home/ubuntu/carboncare-site",
    owner: "customer",
    deployment: "IONOS VPS · GitHub Action Deploy",
    monitoring: "external_http",
  },
  {
    name: "CarbonCare Rechnung",
    url: "https://rechnung.carbon-care.de",
    note: "Kunden-App / Rechnungstool",
    localPath: "/home/ubuntu/carboncare-rechnung",
    owner: "customer",
    deployment: "IONOS VPS · GitHub Action Deploy",
    monitoring: "external_http",
  },
];

async function runCommand(command: string, args: string[]) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, { timeout: 15_000, maxBuffer: 1024 * 1024 * 4 });
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return {
      ok: false,
      stdout: (err.stdout || "").trim(),
      stderr: (err.stderr || "").trim(),
      error: err.message || "command failed",
    };
  }
}

async function getDeployUpdatedAt(path: string | null) {
  if (!path) return null;
  try {
    const stat = await fs.stat(path);
    return stat.mtime.toISOString();
  } catch {
    return null;
  }
}

async function getTlsValidTo(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    const host = parsed.hostname;
    const port = parsed.port ? Number(parsed.port) : 443;
    return await new Promise<string | null>((resolve) => {
      const socket = tls.connect(
        {
          host,
          port,
          servername: host,
          rejectUnauthorized: false,
          timeout: 8000,
        },
        () => {
          const cert = socket.getPeerCertificate();
          socket.end();
          if (!cert?.valid_to) return resolve(null);
          const date = new Date(cert.valid_to);
          resolve(Number.isNaN(date.getTime()) ? null : date.toISOString());
        },
      );
      socket.on("error", () => resolve(null));
      socket.on("timeout", () => {
        socket.destroy();
        resolve(null);
      });
    });
  } catch {
    return null;
  }
}

async function fetchWebsiteStatus(target: WebsiteTarget): Promise<WebsiteStatus> {
  const started = Date.now();
  const [deployUpdatedAt, tlsValidTo] = await Promise.all([
    getDeployUpdatedAt(target.localPath),
    getTlsValidTo(target.url),
  ]);
  try {
    const res = await fetch(target.url, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    return {
      name: target.name,
      url: target.url,
      note: target.note,
      owner: target.owner,
      deployment: target.deployment,
      monitoring: target.monitoring,
      httpStatus: res.status,
      ok: res.status >= 200 && res.status < 400,
      latencyMs: Date.now() - started,
      deployUpdatedAt,
      tlsValidTo,
      error: null,
    };
  } catch (error) {
    return {
      name: target.name,
      url: target.url,
      note: target.note,
      owner: target.owner,
      deployment: target.deployment,
      monitoring: target.monitoring,
      httpStatus: null,
      ok: false,
      latencyMs: Date.now() - started,
      deployUpdatedAt,
      tlsValidTo,
      error: error instanceof Error ? error.message : "fetch failed",
    };
  }
}

function parsePm2List(stdout: string): ProcessSummary[] {
  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("│"));

  const out: ProcessSummary[] = [];
  for (const line of lines) {
    const cells = line
      .split("│")
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (cells.length < 12) continue;
    if (!/^\d+$/.test(cells[0])) continue;
    const memoryRaw = cells[10] || "";
    const memMatch = memoryRaw.match(/([\d.]+)\s*(mb|gb|kb)/i);
    let memoryMb: number | null = null;
    if (memMatch) {
      const value = Number(memMatch[1]);
      const unit = memMatch[2].toLowerCase();
      memoryMb = unit === "gb" ? value * 1024 : unit === "kb" ? value / 1024 : value;
    }
    out.push({
      name: cells[1],
      status: cells[8],
      cpu: cells[9],
      memoryMb,
      uptime: cells[6],
    });
  }
  return out;
}

function parseFree(stdout: string) {
  const line = stdout
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.toLowerCase().startsWith("mem:"));
  if (!line) {
    return { totalMb: null, usedMb: null, freeMb: null };
  }
  const parts = line.split(/\s+/);
  return {
    totalMb: Number(parts[1]) || null,
    usedMb: Number(parts[2]) || null,
    freeMb: Number(parts[3]) || null,
  };
}

function parseDf(stdout: string) {
  const lines = stdout.split("\n").filter(Boolean);
  if (lines.length < 2) return null;
  const parts = lines[1].split(/\s+/);
  if (parts.length < 6) return null;
  return {
    size: parts[1],
    used: parts[2],
    available: parts[3],
    usedPercent: parts[4],
    mount: parts[5],
  };
}

function parsePortCheck(stdout: string) {
  return stdout.split("\n").map((line) => line.trim()).filter(Boolean).length > 0;
}

function parsePercent(value: string | undefined | null) {
  if (!value) return null;
  const numeric = Number(value.replace("%", "").trim());
  return Number.isFinite(numeric) ? numeric : null;
}

function getDaysUntil(dateIso: string | null) {
  if (!dateIso) return null;
  const diffMs = new Date(dateIso).getTime() - Date.now();
  if (!Number.isFinite(diffMs)) return null;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function collectSupportOpportunities(input: {
  websites: WebsiteStatus[];
  processes: ProcessSummary[];
  system: SystemStatus;
  infra: InfraStatus;
}) {
  const opportunities: SupportOpportunity[] = [];

  for (const site of input.websites) {
    const tlsDays = getDaysUntil(site.tlsValidTo);

    if (!site.ok) {
      opportunities.push({
        id: `site-down-${site.name}`,
        scope: "website",
        severity: "high",
        title: `${site.name} nicht erreichbar`,
        detail: site.error || `HTTP ${site.httpStatus ?? "unbekannt"}`,
        target: site.url,
      });
    } else if ((site.latencyMs ?? 0) >= 1500) {
      opportunities.push({
        id: `site-slow-${site.name}`,
        scope: "website",
        severity: site.owner === "customer" ? "medium" : "low",
        title: `${site.name} antwortet langsam`,
        detail: `${site.latencyMs} ms beim letzten Check`,
        target: site.url,
      });
    }

    if (tlsDays !== null && tlsDays <= 14) {
      opportunities.push({
        id: `site-tls-${site.name}`,
        scope: "website",
        severity: tlsDays <= 7 ? "high" : "medium",
        title: `TLS-Zertifikat bald faellig`,
        detail: `${site.name} laeuft in ${tlsDays} Tagen ab`,
        target: site.url,
      });
    }
  }

  for (const process of input.processes) {
    if (process.status !== "online") {
      opportunities.push({
        id: `process-${process.name}`,
        scope: "process",
        severity: "high",
        title: `PM2-Prozess offline`,
        detail: `${process.name} steht auf ${process.status}`,
        target: process.name,
      });
    }
  }

  const diskPercent = parsePercent(input.system.disk?.usedPercent);
  if (diskPercent !== null && diskPercent >= 85) {
    opportunities.push({
      id: "system-disk",
      scope: "system",
      severity: diskPercent >= 92 ? "high" : "medium",
      title: "Root-Disk fast voll",
      detail: `${input.system.disk?.usedPercent} belegt auf ${input.system.disk?.mount}`,
      target: input.system.hostname,
    });
  }

  const loadValues = input.system.loadAverage
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry));
  if (loadValues.length > 0 && loadValues[0] >= 6) {
    opportunities.push({
      id: "system-load",
      scope: "system",
      severity: loadValues[0] >= 10 ? "high" : "medium",
      title: "Erhoehte Server-Last",
      detail: `1m Load bei ${loadValues[0].toFixed(2)}`,
      target: input.system.hostname,
    });
  }

  if (input.infra.nginx !== "active") {
    opportunities.push({
      id: "infra-nginx",
      scope: "infra",
      severity: "high",
      title: "nginx nicht aktiv",
      detail: `systemctl meldet ${input.infra.nginx}`,
      target: "nginx",
    });
  }

  if (!input.infra.postgres5432) {
    opportunities.push({
      id: "infra-postgres5432",
      scope: "infra",
      severity: "high",
      title: "Postgres :5432 nicht erreichbar",
      detail: "Port-Check hat keinen Listener gefunden",
      target: "Postgres :5432",
    });
  }

  return opportunities.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [
    websites,
    hostnameRes,
    uptimeRes,
    freeRes,
    dfRes,
    pm2Res,
    nginxRes,
    pg5432Res,
    cronRes,
  ] = await Promise.all([
    Promise.all(WEBSITE_TARGETS.map(fetchWebsiteStatus)),
    runCommand("hostname", []),
    runCommand("uptime", []),
    runCommand("free", ["-m"]),
    runCommand("df", ["-h", "/"]),
    runCommand("pm2", ["list"]),
    runCommand("systemctl", ["is-active", "nginx"]),
    runCommand("bash", ["-lc", "ss -ltn '( sport = :5432 )' | tail -n +2"]),
    runCommand("crontab", ["-l"]),
  ]);

  const hostname = hostnameRes.ok ? hostnameRes.stdout : "unknown";
  const uptimeLine = uptimeRes.ok ? uptimeRes.stdout : "";
  const loadMatch = uptimeLine.match(/load average: (.+)$/i);
  const memory = freeRes.ok ? parseFree(freeRes.stdout) : { totalMb: null, usedMb: null, freeMb: null };
  const disk = dfRes.ok ? parseDf(dfRes.stdout) : null;
  const processes = pm2Res.ok ? parsePm2List(pm2Res.stdout) : [];
  const cronEntries = cronRes.ok
    ? cronRes.stdout
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
    : [];
  const system = {
    hostname,
    uptime: uptimeLine || "unavailable",
    loadAverage: loadMatch?.[1] || "unavailable",
    memory,
    disk,
  };
  const infra = {
    nginx: nginxRes.ok ? nginxRes.stdout || "unknown" : nginxRes.error || "unknown",
    postgres5432: pg5432Res.ok ? parsePortCheck(pg5432Res.stdout) : false,
    cronEntries,
  };
  const opportunities = collectSupportOpportunities({ websites, processes, system, infra });

  return {
    generatedAt: new Date().toISOString(),
    system,
    websites,
    processes,
    infra,
    opportunities,
  };
}
