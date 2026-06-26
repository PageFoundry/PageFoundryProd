import { load } from "cheerio";
import { chromium, devices, type BrowserContext, type Page } from "playwright";
import { normalizeWebsiteUrl } from "./discovery";
import { calculateOpportunityScore, calculateWebsiteScore } from "./scoring";
import { assertPublicAuditUrl, blockedAuditUrl } from "./urlSafety";
import type { SocialAudit, WebsiteAuditResult } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const MENU_SELECTORS = [
  "button[aria-controls]",
  "button[aria-expanded]",
  "button[aria-label*='menu' i]",
  "button[aria-label*='navigation' i]",
  "button[aria-label*='nav' i]",
  "[role='button'][aria-label*='menu' i]",
  ".hamburger",
  ".hamburger-menu",
  ".burger",
  ".menu-toggle",
  ".navbar-toggler",
  ".mobile-menu-toggle",
  "[class*='hamburger']",
  "[class*='burger']",
  "[class*='menu-toggle']",
  "[id*='menu-toggle']",
].join(",");

function roundMetric(value: number | null | undefined, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function withTimeoutSignal(ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { controller, done: () => clearTimeout(timeout) };
}

async function requestExists(baseUrl: string, pathname: string) {
  const { controller, done } = withTimeoutSignal(8000);
  try {
    const response = await fetch(new URL(pathname, baseUrl).toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT },
    });
    if (!response.ok) return false;
    const text = await response.text().catch(() => "");
    return text.trim().length > 0;
  } catch {
    return false;
  } finally {
    done();
  }
}

async function installVitalsObserver(page: Page) {
  await page.addInitScript(() => {
    const target = window as typeof window & { __pfAuditVitals?: { lcp: number; cls: number } };
    target.__pfAuditVitals = { lcp: 0, cls: 0 };
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const last = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        target.__pfAuditVitals!.lcp = last.renderTime || last.loadTime || last.startTime || 0;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      target.__pfAuditVitals!.lcp = 0;
    }
    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
          if (!entry.hadRecentInput) target.__pfAuditVitals!.cls += entry.value || 0;
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      target.__pfAuditVitals!.cls = 0;
    }
  });
}

async function readPerformance(page: Page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const fallback = performance.now();
    const loadMs = nav?.loadEventEnd && nav.loadEventEnd > 0 ? nav.loadEventEnd : fallback;
    const vitals = (window as typeof window & { __pfAuditVitals?: { lcp: number; cls: number } }).__pfAuditVitals;
    return {
      loadTime: loadMs / 1000,
      lcp: vitals?.lcp ? vitals.lcp / 1000 : null,
      cls: vitals?.cls ?? null,
    };
  });
}

function detectContactChecks(source: string) {
  const $ = load(source);
  const links = $("a[href]")
    .map((_, element) => $(element).attr("href") || "")
    .get();

  const contactFormFound =
    $("form").filter((_, element) => {
      const formText = `${$(element).text()} ${$(element).attr("action") || ""}`.toLowerCase();
      const hasContactField = $(element).find("input[type='email'], input[name*='mail' i], textarea, input[name*='phone' i], input[name*='name' i]").length > 0;
      return hasContactField || /kontakt|contact|anfrage|message|nachricht/.test(formText);
    }).length > 0;

  return {
    contactFormFound,
    mailtoFound: links.some((href) => href.toLowerCase().startsWith("mailto:")),
    phoneClickable: links.some((href) => href.toLowerCase().startsWith("tel:")),
    whatsappFound: links.some((href) => /wa\.me|api\.whatsapp\.com|whatsapp:\/\//i.test(href)),
  };
}

async function getMenuState(page: Page) {
  return page.evaluate(() => {
    function visible(element: Element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    }
    const elements = Array.from(
      document.querySelectorAll(
        "nav,[role='navigation'],[role='dialog'],[aria-modal='true'],.menu,.mobile-menu,.navbar-collapse,.drawer,.offcanvas,.elementor-menu-toggle + *",
      ),
    ).filter(visible);
    return {
      visibleCount: elements.length,
      textLength: elements.map((element) => element.textContent || "").join(" ").trim().length,
      bodyClass: document.body.className,
      htmlLength: document.body.innerHTML.length,
    };
  });
}

async function checkMobileMenu(page: Page) {
  const candidates = page.locator(MENU_SELECTORS);
  const count = Math.min(await candidates.count().catch(() => 0), 10);
  if (count === 0) return false;

  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    const visible = await candidate.isVisible({ timeout: 1000 }).catch(() => false);
    if (!visible) continue;

    const before = await getMenuState(page);
    const beforeAria = await candidate.getAttribute("aria-expanded").catch(() => null);
    await candidate.click({ timeout: 3000 }).catch(() => null);
    await page.waitForTimeout(1000);
    const after = await getMenuState(page);
    const afterAria = await candidate.getAttribute("aria-expanded").catch(() => null);

    const ariaOpened = afterAria === "true" || (beforeAria !== null && beforeAria !== afterAria);
    const menuBecameVisible = after.visibleCount > before.visibleCount || after.textLength > before.textLength + 30;
    const classChanged = before.bodyClass !== after.bodyClass && after.textLength >= before.textLength;
    const domChanged = Math.abs(after.htmlLength - before.htmlLength) > 120;

    if (ariaOpened || menuBecameVisible || classChanged || domChanged) return true;
  }

  return false;
}

async function hasVisibleModal(page: Page) {
  return page.evaluate(() => {
    function visible(element: Element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    }
    return Array.from(
      document.querySelectorAll("[role='dialog'],dialog,.modal,.popup,.elementor-popup-modal,.pum-container,[aria-modal='true']"),
    ).some(visible);
  });
}

async function clickLegalLink(context: BrowserContext, url: string, terms: string[]) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
    const found = await page.evaluate((needles) => {
      const lowerNeedles = needles.map((term) => term.toLowerCase());
      return Array.from(document.querySelectorAll("a")).some((link) => {
        const text = `${link.textContent || ""} ${link.getAttribute("href") || ""}`.toLowerCase();
        return lowerNeedles.some((term) => text.includes(term));
      });
    }, terms);

    if (!found) return { found: false, clickable: false };

    const beforeUrl = page.url();
    const beforeText = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
    await page.evaluate((needles) => {
      const lowerNeedles = needles.map((term) => term.toLowerCase());
      const link = Array.from(document.querySelectorAll("a")).find((candidate) => {
        const text = `${candidate.textContent || ""} ${candidate.getAttribute("href") || ""}`.toLowerCase();
        return lowerNeedles.some((term) => text.includes(term));
      });
      if (link) {
        link.removeAttribute("target");
        link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        link.click();
      }
    }, terms);
    await page.waitForTimeout(1200);

    const afterUrl = page.url();
    const afterText = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
    const modalVisible = await hasVisibleModal(page).catch(() => false);
    const textChanged = Math.abs(afterText.length - beforeText.length) > 100;
    const termVisible = terms.some((term) => afterText.toLowerCase().includes(term.toLowerCase()));

    return {
      found: true,
      clickable: afterUrl !== beforeUrl || modalVisible || (textChanged && termVisible),
    };
  } catch {
    return { found: false, clickable: false };
  } finally {
    await page.close().catch(() => null);
  }
}

function decodeBase64Url(value: string) {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(normalized, "base64").toString("utf8");
  } catch {
    return "";
  }
}

function extractElementorPopupRefs(source: string) {
  const refs = new Set<string>();
  const ids = new Set<string>();
  for (const match of source.matchAll(/elementor-action:action=popup:open[^"'<\s)]*/gi)) {
    const raw = match[0].replace(/&amp;/g, "&");
    const decoded = decodeURIComponent(raw);
    refs.add(decoded);
    const idMatch = decoded.match(/[?&]id=(\d+)/i) || decoded.match(/popup[:=](\d+)/i);
    if (idMatch) ids.add(idMatch[1]);
    const settingsMatch = decoded.match(/[?&]settings=([^&]+)/i);
    if (settingsMatch) {
      const settings = decodeBase64Url(settingsMatch[1]);
      const parsedId = settings.match(/"id"\s*:\s*"?(\d+)"?/i);
      if (parsedId) ids.add(parsedId[1]);
    }
  }
  return { refs: [...refs], ids: [...ids] };
}

async function checkElementorPopup(context: BrowserContext, url: string, source: string) {
  const elementorDetected = /elementor|elementor-pro|elementor-action/i.test(source);
  const popupRefs = extractElementorPopupRefs(source);
  if (!elementorDetected || popupRefs.refs.length === 0) {
    return { elementorDetected, brokenPopupDetected: false, popupIds: popupRefs.ids };
  }

  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
    const popupLinks = page.locator("a[href*='elementor-action:action=popup:open']");
    const count = Math.min(await popupLinks.count().catch(() => 0), 5);
    if (count === 0) return { elementorDetected, brokenPopupDetected: true, popupIds: popupRefs.ids };

    for (let index = 0; index < count; index += 1) {
      const link = popupLinks.nth(index);
      const visible = await link.isVisible({ timeout: 1000 }).catch(() => false);
      if (!visible) continue;
      const before = await getMenuState(page);
      await link.click({ timeout: 3000 }).catch(() => null);
      await page.waitForTimeout(1000);
      const modalVisible = await hasVisibleModal(page).catch(() => false);
      const after = await getMenuState(page);
      if (modalVisible || after.htmlLength > before.htmlLength + 120 || after.visibleCount > before.visibleCount) {
        return { elementorDetected, brokenPopupDetected: false, popupIds: popupRefs.ids };
      }
    }

    return { elementorDetected, brokenPopupDetected: true, popupIds: popupRefs.ids };
  } finally {
    await page.close().catch(() => null);
  }
}

async function collectLighthouseMetrics(url: string) {
  if (process.env.SOCIAL_AUDIT_LIGHTHOUSE === "0") return {};
  let chrome: { port: number; kill: () => void | Promise<void> } | null = null;
  try {
    const { launch } = await import("chrome-launcher");
    const lighthouseModule = await import("lighthouse");
    const lighthouse = lighthouseModule.default as any;
    chrome = await launch({
      chromePath: chromium.executablePath(),
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    });
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance"],
      formFactor: "mobile",
      screenEmulation: {
        mobile: true,
        width: 393,
        height: 852,
        deviceScaleFactor: 3,
        disabled: false,
      },
    });
    const audits = result?.lhr?.audits;
    return {
      lcp: audits?.["largest-contentful-paint"]?.numericValue
        ? audits["largest-contentful-paint"].numericValue / 1000
        : null,
      cls: audits?.["cumulative-layout-shift"]?.numericValue ?? null,
    };
  } catch {
    return {};
  } finally {
    if (chrome) await Promise.resolve(chrome.kill()).catch(() => null);
  }
}

async function gotoWebsite(page: Page, website: string) {
  const normalized = normalizeWebsiteUrl(website);
  if (!normalized) throw new Error("invalid_website");
  await assertPublicAuditUrl(normalized);
  await installVitalsObserver(page);
  try {
    return await page.goto(normalized, { waitUntil: "domcontentloaded", timeout: 30_000 });
  } catch (err) {
    if (normalized.startsWith("https://")) {
      const fallback = normalized.replace(/^https:\/\//i, "http://");
      return await page.goto(fallback, { waitUntil: "domcontentloaded", timeout: 30_000 });
    }
    throw err;
  }
}

export async function runWebsiteAudit(audit: Pick<SocialAudit, "website" | "socialScore">): Promise<WebsiteAuditResult> {
  if (!audit.website) throw new Error("website_required");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const device = devices["iPhone 14 Pro"] || devices["iPhone 13 Pro"];
  const context = await browser.newContext({
    ...device,
    userAgent: USER_AGENT,
    ignoreHTTPSErrors: true,
  });
  if (process.env.SOCIAL_AUDIT_ALLOW_PRIVATE_TARGETS !== "1") {
    await context.route("**/*", async (route) => {
      if (blockedAuditUrl(route.request().url())) {
        await route.abort().catch(() => null);
        return;
      }
      await route.continue().catch(() => null);
    });
  }

  try {
    const page = await context.newPage();
    const response = await gotoWebsite(page, audit.website);
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => null);
    await page.waitForTimeout(1500);

    const finalUrl = page.url();
    await assertPublicAuditUrl(finalUrl);
    const source = await page.content();
    const responseStatus = response?.status() ?? 0;
    const httpsEnabled = finalUrl.startsWith("https://");
    const performance = await readPerformance(page).catch(() => ({ loadTime: null, lcp: null, cls: null }));
    const lighthouse = await collectLighthouseMetrics(finalUrl);

    const contact = detectContactChecks(source);
    const mobileMenuWorking = await checkMobileMenu(page).catch(() => false);
    const legalImpressum = await clickLegalLink(context, finalUrl, ["impressum", "legal"]);
    const legalPrivacy = await clickLegalLink(context, finalUrl, ["datenschutz", "privacy"]);
    const robotsTxtFound = await requestExists(finalUrl, "/robots.txt");
    const sitemapFound = await requestExists(finalUrl, "/sitemap.xml");
    const elementor = await checkElementorPopup(context, finalUrl, source);

    const lcp = roundMetric(lighthouse.lcp ?? performance.lcp);
    const cls = roundMetric(lighthouse.cls ?? performance.cls, 3);
    const loadTime = roundMetric(performance.loadTime);

    const issues: string[] = [];
    if (responseStatus !== 200) issues.push(`Homepage returned HTTP ${responseStatus || "unknown"}`);
    if (!httpsEnabled) issues.push("HTTPS not enabled");
    if (!mobileMenuWorking) issues.push("Mobile menu broken");
    if (!legalImpressum.found || !legalImpressum.clickable) issues.push("Impressum inaccessible");
    if (!legalPrivacy.found || !legalPrivacy.clickable) issues.push("Privacy policy inaccessible");
    if (elementor.brokenPopupDetected) {
      const popupId = elementor.popupIds[0] ? ` ${elementor.popupIds[0]}` : "";
      issues.push(`Broken Elementor popup${popupId}`);
    }
    if (!robotsTxtFound) issues.push("Missing robots.txt");
    if (!sitemapFound) issues.push("Missing sitemap.xml");
    if (!contact.contactFormFound && !contact.mailtoFound && !contact.phoneClickable && !contact.whatsappFound) {
      issues.push("Contact button not clickable");
    }
    if ((lcp !== null && lcp > 4) || (cls !== null && cls > 0.25) || (loadTime !== null && loadTime > 5)) {
      issues.push("Poor performance");
    }

    const websiteScore = calculateWebsiteScore({
      mobileMenuWorking,
      impressumClickable: legalImpressum.clickable,
      privacyClickable: legalPrivacy.clickable,
      ...contact,
      brokenPopupDetected: elementor.brokenPopupDetected,
      lcp,
      cls,
      loadTime,
    });
    const opportunityScore = calculateOpportunityScore({
      socialScore: audit.socialScore,
      websiteScore,
      mobileMenuWorking,
      impressumClickable: legalImpressum.clickable,
      privacyClickable: legalPrivacy.clickable,
      contactFormFound: contact.contactFormFound,
    });

    return {
      website: finalUrl,
      websiteScore,
      opportunityScore,
      mobileMenuWorking,
      ...contact,
      impressumFound: legalImpressum.found,
      impressumClickable: legalImpressum.clickable,
      privacyFound: legalPrivacy.found,
      privacyClickable: legalPrivacy.clickable,
      robotsTxtFound,
      sitemapFound,
      elementorDetected: elementor.elementorDetected,
      brokenPopupDetected: elementor.brokenPopupDetected,
      lcp,
      cls,
      loadTime,
      issues,
    };
  } finally {
    await context.close().catch(() => null);
    await browser.close().catch(() => null);
  }
}
