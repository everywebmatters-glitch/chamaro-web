import test from "node:test";
import assert from "node:assert/strict";
import { MAX_HERO_BANNERS, toHeroSlides, type ApiBannerRow } from "../app/lib/hero-banners.ts";

const ORIGIN = "https://api.example.com";
const NOW = new Date("2026-10-20T12:00:00.000Z");
const row = (id: string, over: Partial<ApiBannerRow> = {}): ApiBannerRow => ({
  id,
  title: `Banner ${id}`,
  imageUrl: `https://cdn.example.com/${id}.jpg`,
  mobileImageUrl: null,
  linkUrl: null,
  altText: null,
  status: "ACTIVE",
  position: 0,
  startAt: null,
  endAt: null,
  ...over,
});
const ids = (rows: ApiBannerRow[]) => toHeroSlides(rows, ORIGIN, NOW).map((slide) => slide.id);

test("maps a banner: image, alt text falls back to the title, link optional", () => {
  const [slide] = toHeroSlides([row("a", { altText: "  Autumn chairs ", linkUrl: "https://shop.example.com/autumn", mobileImageUrl: "https://cdn.example.com/a-m.jpg" })], ORIGIN, NOW);
  assert.deepEqual(slide, { id: "a", title: "Banner a", image: "https://cdn.example.com/a.jpg", mobileImage: "https://cdn.example.com/a-m.jpg", alt: "Autumn chairs", href: "https://shop.example.com/autumn" });
  const [plain] = toHeroSlides([row("b")], ORIGIN, NOW);
  assert.equal(plain.alt, "Banner b");
  assert.equal("href" in plain, false);
  assert.equal("mobileImage" in plain, false);
});

test("only ACTIVE banners inside their schedule are shown", () => {
  const rows = [
    row("draft", { status: "DRAFT" }),
    row("archived", { status: "ARCHIVED" }),
    row("future", { startAt: "2026-10-21T00:00:00.000Z" }),
    row("expired", { endAt: "2026-10-19T00:00:00.000Z" }),
    row("current", { startAt: "2026-10-20T00:00:00.000Z", endAt: "2026-10-21T00:00:00.000Z" }),
    row("open"),
    row("broken-date", { startAt: "not a date" }),
  ];
  assert.deepEqual(ids(rows).sort(), ["current", "open"]);
});

test("schedule edges are inclusive", () => {
  assert.deepEqual(ids([row("start", { startAt: NOW.toISOString() }), row("end", { endAt: NOW.toISOString() })]).sort(), ["end", "start"]);
});

test("banners are ordered by position", () => {
  assert.deepEqual(ids([row("c", { position: 2 }), row("a", { position: 0 }), row("b", { position: 1 })]), ["a", "b", "c"]);
});

test("only http(s) addresses are used; unusable images drop the banner, unusable links just lose the link", () => {
  assert.deepEqual(ids([row("js", { imageUrl: "javascript:alert(1)" }), row("data", { imageUrl: "data:image/png;base64,AAAA" }), row("blank", { imageUrl: "" }), row("junk", { imageUrl: "not a url" })]), []);
  const [slide] = toHeroSlides([row("x", { linkUrl: "javascript:alert(1)", mobileImageUrl: "data:text/html,hi" })], ORIGIN, NOW);
  assert.equal(slide.href, undefined);
  assert.equal(slide.mobileImage, undefined);
});

test("root-relative paths (older uploads) are resolved against the API origin", () => {
  const [slide] = toHeroSlides([row("rel", { imageUrl: "/api/v1/media/abc" })], ORIGIN, NOW);
  assert.equal(slide.image, "https://api.example.com/api/v1/media/abc");
});

test("an empty or all-hidden list gives no slides, and the list is capped", () => {
  assert.deepEqual(toHeroSlides([], ORIGIN, NOW), []);
  const many = Array.from({ length: MAX_HERO_BANNERS + 5 }, (_, index) => row(`n${index}`, { position: index }));
  assert.equal(toHeroSlides(many, ORIGIN, NOW).length, MAX_HERO_BANNERS);
});

test("the sub heading is trimmed; blank or missing means none", () => {
  const sub = (subtitle: string | null | undefined) => toHeroSlides([row("a", { subtitle })], ORIGIN, NOW)[0];
  assert.equal(sub("  Premium seating  ")?.subtitle, "Premium seating");
  for (const none of ["", "   ", null, undefined]) assert.equal("subtitle" in sub(none), false);
});
