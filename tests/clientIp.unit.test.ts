import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { clientIpFromForwardedFor } from "../src/lib/clientIp";

describe("clientIpFromForwardedFor", () => {
  test("verwendet bei einer nginx-Proxy-Kette den letzten Hop", () => {
    assert.equal(clientIpFromForwardedFor("203.0.113.9, 198.51.100.4"), "198.51.100.4");
  });

  test("ignoriert leere und vorangestellte manipulierte Werte", () => {
    assert.equal(clientIpFromForwardedFor("spoofed, , 127.0.0.1"), "127.0.0.1");
    assert.equal(clientIpFromForwardedFor(null), "unknown");
  });
});
