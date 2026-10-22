import test from "node:test";
import assert from "node:assert/strict";
import { safeReturnPath } from "../app/lib/return-path.ts";

test("a path on this site is kept, query string included", () => {
  assert.equal(safeReturnPath("/checkout"), "/checkout");
  assert.equal(safeReturnPath("/cart/"), "/cart/");
  assert.equal(safeReturnPath("/products/boss-chair/?color=black"), "/products/boss-chair/?color=black");
});

test("anything that could leave the site, or nothing at all, goes to the account page", () => {
  for (const value of [null, undefined, "", "checkout", "//evil.example", "///evil.example", "https://evil.example", "http://evil.example/x", "/\\evil.example", "\\\\evil.example", "/javascript:alert(1)", "/\nfoo", "/%0d"]) {
    const expected = value === "/%0d" ? "/%0d" : "/account";
    assert.equal(safeReturnPath(value as string | null), expected, String(value));
  }
});
