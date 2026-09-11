import assert from "node:assert/strict";
import test from "node:test";
import { parseObservedProvenance } from "../src/lib/attribution";
test("attribution categories and path allowlist", () => {
  assert.equal(parseObservedProvenance({ referrer: "https://www.google.de/search?q=x", href: "https://pagefoundry.de/consultation", pathname: "/seo-hueckeswagen" }).observedSource, "organic_search");
  assert.equal(parseObservedProvenance({ referrer: "https://pagefoundry.de/", href: "https://pagefoundry.de/consultation", pathname: "/consultation" }).observedSource, "direct_or_unknown");
  assert.equal(parseObservedProvenance({ referrer: "https://example.com/", href: "https://pagefoundry.de/consultation?utm_source=x", pathname: "/consultation" }).observedSource, "campaign");
  assert.equal(parseObservedProvenance({ referrer: "https://google.evil/", href: "https://pagefoundry.de/consultation", pathname: "/private" }).observedSource, "referral");
  assert.equal(parseObservedProvenance({ referrer: "", href: "https://pagefoundry.de/consultation", pathname: "/private" }).entryPathname, null);
});
