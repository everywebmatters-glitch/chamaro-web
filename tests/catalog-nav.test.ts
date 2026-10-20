// Pure navigation/search helpers (no framework, no network): run with `npm test`.
import test from "node:test";
import assert from "node:assert/strict";
import { categoryHref, categoryIcon, FALLBACK_CATEGORY_ICON, searchCatalog, uniqueCategories } from "../app/lib/catalog-nav.ts";

const product = (name: string, extra: Record<string, unknown> = {}) => ({ name, shortDescription: "", categoryName: "Chairs", ...extra });
const catalog = [
  product("Boss Chairs", { shortDescription: "Bistro Café Chair with armrests." }),
  product("test1", { specs: [{ label: "SKU", value: "TS-CL-002" }] }),
  product("test2", { categoryName: "Stools" }),
  product("Mesh Boss Chair", { categoryName: "Boss" }),
];
const names = (items: { name: string }[]) => items.map((item) => item.name);

test("category links use the real slug, encoded", () => {
  assert.equal(categoryHref("chairs"), "/products?category=chairs");
  assert.equal(categoryHref("bar stool&x"), "/products?category=bar%20stool%26x");
});

test("known category slugs keep their icon; unknown ones get the generic chair", () => {
  assert.equal(categoryIcon("boss"), "/icons/boss-chair.svg");
  assert.equal(categoryIcon("chairs"), FALLBACK_CATEGORY_ICON);
  assert.equal(categoryIcon(""), FALLBACK_CATEGORY_ICON);
});

test("search returns nothing until the catalog has loaded, or for an empty query", () => {
  assert.deepEqual(searchCatalog(null, "boss"), []);
  assert.deepEqual(searchCatalog(catalog, ""), []);
  assert.deepEqual(searchCatalog(catalog, "   "), []);
});

test("search matches name, category, description and SKU, case-insensitively", () => {
  assert.deepEqual(names(searchCatalog(catalog, "TEST1")), ["test1"]);
  assert.deepEqual(names(searchCatalog(catalog, "stools")), ["test2"]);
  assert.deepEqual(names(searchCatalog(catalog, "armrests")), ["Boss Chairs"]);
  assert.deepEqual(names(searchCatalog(catalog, "ts-cl-002")), ["test1"]);
});

test("every typed word must match; names that start with the query come first", () => {
  assert.deepEqual(names(searchCatalog(catalog, "boss chair")), ["Boss Chairs", "Mesh Boss Chair"]);
  assert.deepEqual(names(searchCatalog(catalog, "boss")), ["Boss Chairs", "Mesh Boss Chair"]);
  assert.deepEqual(searchCatalog(catalog, "boss stool"), []);
});

test("search never returns a product that is not in the catalog it was given, and honours the limit", () => {
  const many = Array.from({ length: 20 }, (_, index) => product(`Chair ${index}`));
  assert.equal(searchCatalog(many, "chair").length, 8);
  assert.equal(searchCatalog(many, "chair", 3).length, 3);
  assert.deepEqual(searchCatalog([], "chair"), []);
});

test("the home strip lists each live category once and invents none", () => {
  const list = uniqueCategories([{ slug: "cafe-chair", name: "Cafe Chair" }, { slug: "chairs", name: "Chairs" }, { slug: "Chairs", name: "Chairs again" }]);
  assert.deepEqual(list.map((c) => c.slug), ["cafe-chair", "chairs"]);
  assert.deepEqual(uniqueCategories([]), []);
});

test("a category named like an icon category (cafe-chair, boss-chairs) uses that icon", () => {
  assert.equal(categoryIcon("cafe-chair"), categoryIcon("cafe"));
  assert.equal(categoryIcon("boss-chairs"), categoryIcon("boss"));
  assert.equal(categoryIcon("chairs"), FALLBACK_CATEGORY_ICON);
});
