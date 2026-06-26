import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";

type Status = "new" | "contacted" | "interested" | "proposal_sent" | "won" | "lost" | "ignored";
type SortMode = "score" | "followers" | "date";

type SocialAudit = {
  id: number;
  companyName: string | null;
  website: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  followers: number | null;
  posts: number | null;
  avgLikes: number | null;
  socialScore: number | null;
  websiteScore: number | null;
  opportunityScore: number | null;
  mobileMenuWorking: boolean;
  contactFormFound: boolean;
  mailtoFound: boolean;
  phoneClickable: boolean;
  whatsappFound: boolean;
  impressumClickable: boolean;
  privacyClickable: boolean;
  robotsTxtFound: boolean;
  sitemapFound: boolean;
  elementorDetected: boolean;
  brokenPopupDetected: boolean;
  lcp: number | null;
  cls: number | null;
  loadTime: number | null;
  issues: string[];
  status: Status;
  createdAt: string;
  recommendation: {
    label: string;
    action: "phone" | "dm" | "email" | "ignore";
    suggestedTime: string;
  };
};

type Snapshot = {
  generatedAt: string;
  audits: SocialAudit[];
  summary: {
    total: number;
    hot: number;
    new: number;
    avgOpportunity: number;
  };
};

const statusLabels: Record<Status, string> = {
  new: "Neu",
  contacted: "Kontaktiert",
  interested: "Interessiert",
  proposal_sent: "Angebot raus",
  won: "Gewonnen",
  lost: "Verloren",
  ignored: "Ignoriert",
};

@Component({
  selector: "pf-social-audit-app",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class SocialAuditAppComponent implements OnInit {
  private readonly http = inject(HttpClient);

  audits: SocialAudit[] = [];
  summary: Snapshot["summary"] = { total: 0, hot: 0, new: 0, avgOpportunity: 0 };
  loading = true;
  busy = false;
  error = "";
  search = "";
  statusFilter: "all" | Status = "all";
  sortMode: SortMode = "score";

  form = {
    companyName: "",
    website: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    followers: "",
    posts: "",
    avgLikes: "",
  };

  readonly statuses: Array<"all" | Status> = ["all", "new", "contacted", "interested", "proposal_sent", "won", "lost", "ignored"];
  readonly sortModes: Array<{ value: SortMode; label: string }> = [
    { value: "score", label: "Score" },
    { value: "followers", label: "Follower" },
    { value: "date", label: "Datum" },
  ];
  readonly statusActions: Array<{ value: Status; label: string }> = [
    { value: "contacted", label: "Kontaktiert" },
    { value: "interested", label: "Interessiert" },
    { value: "won", label: "Gewonnen" },
    { value: "lost", label: "Verloren" },
    { value: "ignored", label: "Ignoriert" },
  ];

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = "";
    this.http.get<Snapshot>("/api/admin/social-audit").subscribe({
      next: (snapshot) => {
        this.audits = snapshot.audits;
        this.summary = snapshot.summary;
        this.loading = false;
      },
      error: () => {
        this.error = "Social-Audit-Daten konnten nicht geladen werden.";
        this.loading = false;
      },
    });
  }

  createAudit() {
    if (this.busy) return;
    this.busy = true;
    this.error = "";
    this.http.post<{ audit: SocialAudit }>("/api/admin/social-audit", this.normalizedForm()).subscribe({
      next: () => {
        this.busy = false;
        this.form = {
          companyName: "",
          website: "",
          instagram: "",
          facebook: "",
          tiktok: "",
          followers: "",
          posts: "",
          avgLikes: "",
        };
        this.load();
      },
      error: (err) => {
        this.error = err?.error?.message || "Audit konnte nicht gestartet werden.";
        this.busy = false;
      },
    });
  }

  updateStatus(audit: SocialAudit, status: Status) {
    this.http.patch<{ audit: SocialAudit }>(`/api/admin/social-audit/${audit.id}`, { status }).subscribe({
      next: ({ audit: updated }) => {
        this.audits = this.audits.map((item) => (item.id === updated.id ? updated : item));
      },
      error: () => {
        this.error = "Status konnte nicht aktualisiert werden.";
      },
    });
  }

  visibleAudits() {
    const query = this.search.trim().toLowerCase();
    return this.audits
      .filter((audit) => {
        if (this.statusFilter !== "all" && audit.status !== this.statusFilter) return false;
        if (!query) return true;
        return [audit.companyName, audit.website, audit.instagramUrl, audit.facebookUrl, audit.tiktokUrl]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .sort((a, b) => {
        if (this.sortMode === "followers") return (b.followers ?? 0) - (a.followers ?? 0);
        if (this.sortMode === "date") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0);
      });
  }

  statusLabel(status: Status | "all") {
    return status === "all" ? "Alle" : statusLabels[status];
  }

  scoreTone(score: number | null) {
    const value = score ?? 0;
    if (value >= 90) return "score score-hot";
    if (value >= 70) return "score score-good";
    if (value >= 50) return "score score-warm";
    return "score score-low";
  }

  actionTone(action: SocialAudit["recommendation"]["action"]) {
    return `action action-${action}`;
  }

  formatNumber(value: number | null) {
    return new Intl.NumberFormat("de-DE").format(value ?? 0);
  }

  formatDate(value: string) {
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(
      new Date(value),
    );
  }

  openPdf(audit: SocialAudit) {
    window.open(`/api/admin/social-audit/${audit.id}/pdf`, "_blank", "noopener,noreferrer");
  }

  trackById(_: number, audit: SocialAudit) {
    return audit.id;
  }

  private normalizedForm() {
    const payload: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(this.form)) {
      const trimmed = value.trim();
      if (!trimmed) continue;
      if (["followers", "posts", "avgLikes"].includes(key)) {
        const parsed = Number(trimmed.replace(",", "."));
        if (Number.isFinite(parsed)) payload[key] = parsed;
      } else {
        payload[key] = trimmed;
      }
    }
    return payload;
  }
}
