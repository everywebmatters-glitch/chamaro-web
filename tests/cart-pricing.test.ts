import test from "node:test";
import assert from "node:assert/strict";
import {
  chairsToFreeShipping,
  discountAmount,
  findDiscount,
  isBossChairProduct,
  isChairProduct,
  shippingCost,
} from "../app/lib/cart-pricing.ts";
import type { Product } from "../app/lib/products.ts";

function chair(name: string, category = "chairs"): Product {
  return {
    slug: name.toLowerCase().replaceAll(" ", "-"),
    name,
    category,
    categoryName: category,
    price: 100,
    rating: 0,
    reviewCount: 0,
    availability: "in-stock",
    shortDescription: "",
    infoBoxes: [],
    description: "",
    images: [],
    colors: [],
    variants: [],
    features: [],
    specs: [],
    salesRank: 0,
  };
}

function line(product: Product, quantity: number) {
  return {
    slug: product.slug,
    color: "",
    quantity,
    key: product.slug,
    product,
    unitPrice: 100,
    lineTotal: 100 * quantity,
  };
}

test("standard delivery is free only when the cart contains two or more chairs", () => {
  assert.equal(chairsToFreeShipping(0), 2);
  assert.equal(chairsToFreeShipping(1), 1);
  assert.equal(chairsToFreeShipping(2), 0);
  assert.equal(shippingCost("standard", 1), 499);
  assert.equal(shippingCost("standard", 2), 0);
  assert.equal(shippingCost("express", 2), 999);
});

test("coupon rules apply to chair lines and limit WELCOME10 to Boss chairs", () => {
  const boss = line(chair("Boss Chair"), 2);
  const office = line(chair("Office Chair"), 1);
  const desk = line(chair("Desk", "office furniture"), 1);
  const subtotal = boss.lineTotal + office.lineTotal + desk.lineTotal;

  assert.equal(isChairProduct(boss.product), true);
  assert.equal(isBossChairProduct(boss.product), true);
  assert.equal(isChairProduct(desk.product), false);
  assert.equal(discountAmount(subtotal, findDiscount("WELCOME10"), [boss, office, desk]), 20);
  assert.equal(discountAmount(subtotal, findDiscount("WELCOME5"), [boss, office, desk]), 15);
  assert.equal(findDiscount("CHAMARO10"), undefined);
});
