import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_B2B_HERO, toB2bHero } from "../app/lib/b2b-hero.ts";

const ORIGIN = "https://api.example.com";
const page = (content: unknown, status = "PUBLISHED", type = "b2b-hero") => ({
  status,
  sections: [{ type, content, position: 0 }],
});

test("missing, draft, or unmatched CMS content keeps the built-in B2B hero", () => {
  assert.deepEqual(toB2bHero(null, ORIGIN), DEFAULT_B2B_HERO);
  assert.deepEqual(toB2bHero(page({ title: "Draft" }, "DRAFT"), ORIGIN), DEFAULT_B2B_HERO);
  assert.deepEqual(toB2bHero(page({ title: "Other" }, "PUBLISHED", "other"), ORIGIN), DEFAULT_B2B_HERO);
});

test("published B2B hero fields override defaults and blank fields fall back", () => {
  const hero = toB2bHero(
    page({
      eyebrow: " Business ",
      title: "Bulk seating",
      description: "",
      imageUrl: "/api/v1/media/hero",
      imageAlt: " Office chair ",
      buttonLabel: "Get a quote",
      buttonUrl: "#quote",
    }),
    ORIGIN,
  );

  assert.deepEqual(hero, {
    ...DEFAULT_B2B_HERO,
    eyebrow: "Business",
    title: "Bulk seating",
    imageUrl: "https://api.example.com/api/v1/media/hero",
    imageAlt: "Office chair",
    buttonLabel: "Get a quote",
  });
});

test("unsafe image and button URLs fall back to safe defaults", () => {
  for (const url of ["javascript:alert(1)", "//evil.com/image", "data:image/png;base64,AA", "/\\evil.com"]) {
    const hero = toB2bHero(page({ imageUrl: url, buttonUrl: url }), ORIGIN);
    assert.equal(hero.imageUrl, DEFAULT_B2B_HERO.imageUrl, url);
    assert.equal(hero.buttonUrl, DEFAULT_B2B_HERO.buttonUrl, url);
  }
  assert.equal(toB2bHero(page({ buttonUrl: "/products" }), ORIGIN).buttonUrl, "/products");
  assert.equal(toB2bHero(page({ buttonUrl: "https://shop.example.com/quote" }), ORIGIN).buttonUrl, "https://shop.example.com/quote");
});
