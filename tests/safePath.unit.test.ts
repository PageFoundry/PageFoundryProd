import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { safeRelativePath } from "../src/lib/safePath";

describe("safeRelativePath", () => {
  test("erlaubt interne Pfade inklusive Query", () => {
    assert.equal(safeRelativePath("/checkout/landing_page?from=home"), "/checkout/landing_page?from=home");
  });

  test("blockiert externe, protokoll-relative und Backslash-Pfade", () => {
    for (const value of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)"]) {
      assert.equal(safeRelativePath(value), "/dashboard");
    }
  });

  test("blockiert Steuerzeichen", () => {
    assert.equal(safeRelativePath("/dashboard\nSet-Cookie:x"), "/dashboard");
  });
});
