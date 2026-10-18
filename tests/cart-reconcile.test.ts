import test from "node:test";
import assert from "node:assert/strict";
import { reconcileCart } from "../app/lib/cart-reconcile.ts";

const catalog = [
  { slug: "a", name: "Chair A", stockLeft: 5 },
  { slug: "b", name: "Chair B", stockLeft: 1 },
  { slug: "c", name: "Chair C", stockLeft: 0 },
  { slug: "d", name: "Chair D" },
];
const line = (slug: string, quantity: number) => ({ slug, quantity, color: "", option: undefined });

test("a cart that matches the catalog is unchanged and produces no notices", () => {
  const cart = [line("a", 2), line("d", 40)];
  const result = reconcileCart(cart, catalog);
  assert.deepEqual(result.cart, cart);
  assert.deepEqual(result.notices, []);
});

test("quantities are trimmed to the units left, with a notice", () => {
  const result = reconcileCart([line("a", 9), line("b", 3)], catalog);
  assert.deepEqual(result.cart.map((l) => [l.slug, l.quantity]), [["a", 5], ["b", 1]]);
  assert.deepEqual(result.notices, [
    "Only 5 of Chair A are available, so we reduced the quantity.",
    "Only 1 of Chair B is available, so we reduced the quantity.",
  ]);
});

test("out-of-stock lines are removed; untracked stock is never limited", () => {
  const result = reconcileCart([line("c", 1), line("d", 99)], catalog);
  assert.deepEqual(result.cart.map((l) => l.slug), ["d"]);
  assert.deepEqual(result.notices, ["Chair C is out of stock and was removed from your cart."]);
});

test("lines whose product is no longer in the catalog are removed and counted in one notice", () => {
  const one = reconcileCart([line("gone", 1), line("a", 1)], catalog);
  assert.deepEqual(one.cart.map((l) => l.slug), ["a"]);
  assert.deepEqual(one.notices, ["A product in your cart is no longer available and was removed."]);
  const two = reconcileCart([line("gone", 1), line("gone2", 1)], catalog);
  assert.deepEqual(two.cart, []);
  assert.deepEqual(two.notices, ["2 products in your cart are no longer available and were removed."]);
});

test("an empty cart or empty catalog behaves", () => {
  assert.deepEqual(reconcileCart([], catalog), { cart: [], notices: [] });
  assert.deepEqual(reconcileCart([line("a", 1)], []).cart, []);
});
