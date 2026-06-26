import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { calculateOpportunityScore, calculateSocialScore, calculateWebsiteScore, getRecommendation } from "../src/lib/socialAudit/scoring";
import { assertPublicAuditUrl, blockedAuditHostname, privateAddress } from "../src/lib/socialAudit/urlSafety";

describe("PF Social Audit scoring", () => {
  test("maps follower counts to the requested social score examples", () => {
    assert.equal(calculateSocialScore({ followers: 500 }), 2.1);
    assert.equal(calculateSocialScore({ followers: 5000 }), 6.4);
    assert.equal(calculateSocialScore({ followers: 15000 }), 8.8);
    assert.equal(calculateSocialScore({ followers: 50000 }), 10);
  });

  test("deducts website score for broken navigation, legal, contact and performance issues", () => {
    const score = calculateWebsiteScore({
      mobileMenuWorking: false,
      impressumClickable: false,
      privacyClickable: false,
      contactFormFound: false,
      mailtoFound: false,
      phoneClickable: false,
      whatsappFound: false,
      brokenPopupDetected: true,
      lcp: 5.2,
      cls: 0.31,
      loadTime: 6.4,
    });

    assert.equal(score, 0);
  });

  test("calculates high-value opportunities and recommendation tiers", () => {
    const opportunity = calculateOpportunityScore({
      socialScore: 8.8,
      websiteScore: 2,
      mobileMenuWorking: false,
      impressumClickable: false,
      privacyClickable: false,
      contactFormFound: false,
    });

    assert.equal(opportunity, 100);
    assert.equal(getRecommendation(opportunity).label, "Sofort anrufen");
    assert.equal(getRecommendation(72).label, "Instagram DM");
    assert.equal(getRecommendation(55).label, "E-Mail");
    assert.equal(getRecommendation(20).label, "Ignorieren");
  });
});

describe("PF Social Audit URL safety", () => {
  test("blocks local and private audit targets", async () => {
    assert.equal(privateAddress("127.0.0.1"), true);
    assert.equal(privateAddress("10.0.0.4"), true);
    assert.equal(privateAddress("172.16.1.1"), true);
    assert.equal(privateAddress("192.168.1.2"), true);
    assert.equal(blockedAuditHostname("localhost"), true);
    assert.equal(blockedAuditHostname("example.com"), false);

    await assert.rejects(() => assertPublicAuditUrl("http://127.0.0.1:3000"), /private_audit_target_blocked/);
  });
});
