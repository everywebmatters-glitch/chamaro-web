import test from "node:test";
import assert from "node:assert/strict";
import {
  discountAmount,
  findDiscount,
  isBossChairProduct,
  isChairProduct,
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
