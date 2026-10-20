import test from "node:test";
import assert from "node:assert/strict";
import { priceFor, unitsLeft } from "../app/lib/products.ts";

const product = { price: 7000, compareAtPrice: 10000 };

test("a variant's own compare-at price wins", () => {
  assert.deepEqual(priceFor(product, { price: 7499, compareAtPrice: 9999 }), { price: 7499, compareAtPrice: 9999 });
});

test("a variant priced like the product keeps the product's compare-at price", () => {
  assert.deepEqual(priceFor(product, { price: 7000 }), { price: 7000, compareAtPrice: 10000 });
  assert.deepEqual(priceFor(product, {}), { price: 7000, compareAtPrice: 10000 });
  assert.deepEqual(priceFor(product), { price: 7000, compareAtPrice: 10000 });
});

test("a variant with a different price and no compare-at price shows none", () => {
  assert.deepEqual(priceFor(product, { price: 6999 }), { price: 6999, compareAtPrice: undefined });
});

test("a compare-at price at or below the price is not shown", () => {
  assert.deepEqual(priceFor({ price: 7000, compareAtPrice: 7000 }), { price: 7000, compareAtPrice: undefined });
});

test("units left is the lower of the variant's and the product's stock", () => {
  assert.equal(unitsLeft({ stockLeft: 50 }, { stock: 3 }), 3);
  assert.equal(unitsLeft({ stockLeft: 2 }, { stock: 10 }), 2);
  assert.equal(unitsLeft({ stockLeft: undefined }, { stock: undefined }), undefined);
  assert.equal(unitsLeft({ stockLeft: 5 }), 5);
});
