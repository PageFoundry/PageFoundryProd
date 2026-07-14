/**
 * Integration tests – Auth flows
 * Run against the live server:  node --test tests/auth.test.mjs
 *
 * Requires: server running on BASE_URL (default http://localhost:3000)
 * Each test run uses a unique e-mail so tests are idempotent.
 */

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";
const uid  = () => Math.random().toString(36).slice(2, 8);

// Die Tests registrieren echte User über die API. Ohne Cleanup bleiben sie liegen —
// bis 2026-07-14 hatten sich so 248 Karteileichen in der Live-DB angesammelt.
const prisma = new PrismaClient();

after(async () => {
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { startsWith: "test+", endsWith: "@example.com" } },
        { email: { startsWith: "nobody+", endsWith: "@example.com" } },
      ],
    },
  });
  await prisma.$disconnect();
});

// ── helpers ──────────────────────────────────────────────────────────────────

function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function extractCookies(res) {
  const out = {};
  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(";");
    const [k, v] = pair.split("=");
    if (k && v !== undefined) out[k.trim()] = v.trim();
  }
  return out;
}

async function register(email, password) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });
  const cookies = extractCookies(res);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, cookies };
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });
  const cookies = extractCookies(res);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, cookies };
}

async function whoami(cookies) {
  const res = await fetch(`${BASE}/api/auth/whoami`, {
    headers: { Cookie: cookieHeader(cookies) },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function logout(cookies) {
  const res = await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: cookieHeader(cookies) },
    redirect: "manual",
  });
  return { status: res.status };
}

async function changePassword(cookies, currentPassword, newPassword) {
  const res = await fetch(`${BASE}/api/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader(cookies),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

// ── server reachability ───────────────────────────────────────────────────────

describe("Server", () => {
  test("is reachable", async () => {
    const res = await fetch(`${BASE}/`);
    assert.equal(res.status, 200, `Expected 200, got ${res.status}. Is the server running at ${BASE}?`);
  });
});

// ── Registration ─────────────────────────────────────────────────────────────

describe("Registration", () => {
  test("creates a new account and returns pf_session cookie", async () => {
    const email = `test+${uid()}@example.com`;
    const { status, body, cookies } = await register(email, "Test1234!");

    assert.equal(status, 200, `register failed: ${JSON.stringify(body)}`);
    assert.ok(body.id, "response should include user id");
    assert.ok(cookies.pf_session, "pf_session cookie must be set after registration");
  });

  test("rejects duplicate e-mail with 409", async () => {
    const email = `test+${uid()}@example.com`;
    await register(email, "Test1234!");
    const { status } = await register(email, "AnotherPw1!");
    assert.equal(status, 409, "second registration with same email should return 409");
  });

  test("rejects missing fields with 400", async () => {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "" }),
    });
    assert.equal(res.status, 400);
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

describe("Login", () => {
  let sharedEmail;
  const pw = "Login1234!";

  before(async () => {
    sharedEmail = `test+${uid()}@example.com`;
    const { status } = await register(sharedEmail, pw);
    assert.equal(status, 200, "setup: registration failed");
  });

  test("succeeds with correct credentials and sets pf_session cookie", async () => {
    const { status, body, cookies } = await login(sharedEmail, pw);
    assert.equal(status, 200, `login failed: ${JSON.stringify(body)}`);
    assert.ok(cookies.pf_session, "pf_session cookie must be set after login");
  });

  test("rejects wrong password with 401", async () => {
    const { status } = await login(sharedEmail, "WrongPw999!");
    assert.equal(status, 401);
  });

  test("rejects unknown email with 401", async () => {
    const { status } = await login(`nobody+${uid()}@example.com`, pw);
    assert.equal(status, 401);
  });
});

// ── Session (whoami) ──────────────────────────────────────────────────────────

describe("Session", () => {
  let sessionCookies;

  before(async () => {
    const email = `test+${uid()}@example.com`;
    const pw = "Session1234!";
    const reg = await register(email, pw);
    assert.equal(reg.status, 200, "setup: registration failed");
    sessionCookies = reg.cookies;
  });

  test("whoami returns user when session cookie is valid", async () => {
    const { status, body } = await whoami(sessionCookies);
    assert.equal(status, 200, `whoami failed: ${JSON.stringify(body)}`);
    assert.ok(body.user?.id || body.id, "response should contain user id");
  });

  test("whoami returns { user: null } with no cookie", async () => {
    const { status, body } = await whoami({});
    assert.equal(status, 200);
    assert.equal(body.user, null, "unauthenticated whoami should return user: null");
  });

  test("whoami returns { user: null } with invalid cookie", async () => {
    const { status, body } = await whoami({ pf_session: "invalid.jwt.token" });
    assert.equal(status, 200);
    assert.equal(body.user, null, "invalid token whoami should return user: null");
  });

  test("legacy session without sv remains valid until the user session version changes", async () => {
    const email = `test+${uid()}@example.com`;
    const reg = await register(email, "Legacy1234!");
    const legacyToken = jwt.sign(
      { sub: reg.body.id, role: "USER" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const before = await whoami({ pf_session: legacyToken });
    assert.equal(before.body.user?.id, reg.body.id);

    await prisma.user.update({
      where: { id: reg.body.id },
      data: { sessionVersion: { increment: 1 } },
    });
    const after = await whoami({ pf_session: legacyToken });
    assert.equal(after.body.user, null);
  });

  test("password change revokes the existing session", async () => {
    const email = `test+${uid()}@example.com`;
    const currentPassword = "Current1234!";
    const nextPassword = "Changed1234!";
    const reg = await register(email, currentPassword);

    const changed = await changePassword(reg.cookies, currentPassword, nextPassword);
    assert.equal(changed.status, 200, JSON.stringify(changed.body));

    const revoked = await whoami(reg.cookies);
    assert.equal(revoked.body.user, null);
    assert.equal((await login(email, currentPassword)).status, 401);
    assert.equal((await login(email, nextPassword)).status, 200);
  });
});

// ── Full flow: register → login → whoami → logout ────────────────────────────

describe("Full auth flow", () => {
  test("register → login → authenticated → logout → unauthenticated", async () => {
    const email = `test+${uid()}@example.com`;
    const pw = "Flow1234!";

    // 1. Register
    const reg = await register(email, pw);
    assert.equal(reg.status, 200, `register failed: ${JSON.stringify(reg.body)}`);

    // 2. Login (new session)
    const lgn = await login(email, pw);
    assert.equal(lgn.status, 200, `login failed: ${JSON.stringify(lgn.body)}`);
    assert.ok(lgn.cookies.pf_session, "must have pf_session after login");

    // 3. Authenticated
    const me = await whoami(lgn.cookies);
    assert.equal(me.status, 200, "should be authenticated after login");

    // 4. Logout (returns 303 redirect to homepage)
    const lo = await logout(lgn.cookies);
    assert.ok([200, 302, 303].includes(lo.status), `unexpected logout status ${lo.status}`);
  });
});
