import test from "node:test";
import assert from "node:assert/strict";
import {
  checkoutErrorMessage,
  checkoutFingerprint,
  findSameAddress,
  paymentOutcomeMessage,
  razorpayContact,
  toAddressInput,
  toServerCartItems,
} from "../app/lib/checkout-flow.ts";

const chair = { id: "prod_1", name: "Lounge Chair", variantIds: { Walnut: "var_w", Oak: "var_o" } };
const stool = { id: "prod_2", name: "Bar Stool", variantIds: {} };

test("the cart is sent by product and variant id, merging duplicate lines; no price is sent", () => {
  const { items, unavailable } = toServerCartItems([
    { product: chair, option: "Walnut", quantity: 1 },
    { product: chair, option: "Walnut", quantity: 2 },
    { product: chair, option: "Oak", quantity: 1 },
    { product: stool, quantity: 4 },
  ]);
  assert.deepEqual(unavailable, []);
  assert.deepEqual(items, [
    { productId: "prod_1", variantId: "var_w", quantity: 3 },
    { productId: "prod_1", variantId: "var_o", quantity: 1 },
    { productId: "prod_2", quantity: 4 },
  ]);
  for (const item of items) for (const key of Object.keys(item)) assert.ok(["productId", "variantId", "quantity"].includes(key), `${key} is never sent`);
});

test("a line whose variant no longer exists is reported, not sent without its variant", () => {
  const { items, unavailable } = toServerCartItems([{ product: chair, option: "Teak", quantity: 1 }, { product: stool, quantity: 1 }]);
  assert.deepEqual(unavailable, ["Lounge Chair"]);
  assert.deepEqual(items, [{ productId: "prod_2", quantity: 1 }]);
});

const form = { firstName: " Asha ", lastName: "Rao", address: " 12 MG Road ", apartment: "", city: "Bengaluru", state: "Karnataka", pin: "560001", phone: "98765  43210" };

test("the delivery form becomes the API's address, with no empty line 2", () => {
  assert.deepEqual(toAddressInput(form), { name: "Asha Rao", phone: "98765 43210", addressLine1: "12 MG Road", city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "IN" });
  assert.equal(toAddressInput({ ...form, firstName: "", apartment: " Flat 4 " }).name, "Rao");
  assert.equal(toAddressInput({ ...form, apartment: " Flat 4 " }).addressLine2, "Flat 4");
});

test("an identical saved address is reused; any real difference is a new address", () => {
  const input = toAddressInput(form);
  const saved = [
    { id: "a1", name: "asha rao", phone: "98765 43210", addressLine1: "12  MG Road", addressLine2: null, city: "BENGALURU", state: "Karnataka", postalCode: "560001", country: "IN" },
    { id: "a2", name: "Asha Rao", phone: "98765 43210", addressLine1: "14 MG Road", addressLine2: null, city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "IN" },
  ];
  assert.equal(findSameAddress(saved, input)?.id, "a1");
  assert.equal(findSameAddress(saved, { ...input, postalCode: "560002" }), undefined);
  assert.equal(findSameAddress(saved, { ...input, addressLine2: "Flat 4" }), undefined);
});

test("the same cart, address, shipping and note give the same fingerprint; any change gives a new one", () => {
  const address = toAddressInput(form);
  const a = checkoutFingerprint([{ productId: "p1", quantity: 1 }, { productId: "p2", variantId: "v", quantity: 2 }], address, "standard", "note");
  const sameOtherOrder = checkoutFingerprint([{ productId: "p2", variantId: "v", quantity: 2 }, { productId: "p1", quantity: 1 }], address, "standard", " note ");
  assert.equal(a, sameOtherOrder);
  for (const changed of [
    checkoutFingerprint([{ productId: "p1", quantity: 2 }, { productId: "p2", variantId: "v", quantity: 2 }], address, "standard", "note"),
    checkoutFingerprint([{ productId: "p1", quantity: 1 }, { productId: "p2", variantId: "v", quantity: 2 }], address, "express", "note"),
    checkoutFingerprint([{ productId: "p1", quantity: 1 }, { productId: "p2", variantId: "v", quantity: 2 }], { ...address, city: "Mysuru" }, "standard", "note"),
  ]) assert.notEqual(changed, a);
});

test("API error codes become plain messages, and never claim no charge once money may have moved", () => {
  assert.match(checkoutErrorMessage("INSUFFICIENT_STOCK"), /no longer available/);
  assert.match(checkoutErrorMessage("ORDER_PAYMENT_EXPIRED"), /check out again/);
  assert.match(checkoutErrorMessage("PAYMENT_IN_PROGRESS"), /confirming it/);
  assert.match(checkoutErrorMessage("SOMETHING_NEW"), /Something went wrong/);
  assert.doesNotMatch(checkoutErrorMessage("PAYMENT_SIGNATURE_INVALID"), /not been charged/);
  assert.doesNotMatch(checkoutErrorMessage("PAYMENT_IN_PROGRESS"), /not been charged/);
});

test("payment outcomes: paid and pending end checkout; failed lets the shopper retry; review never invites a second payment", () => {
  assert.equal(paymentOutcomeMessage("paid").done, true);
  assert.equal(paymentOutcomeMessage("already_paid").done, true);
  assert.equal(paymentOutcomeMessage("pending").done, true);
  assert.match(paymentOutcomeMessage("pending").message, /no need to pay again/);
  assert.equal(paymentOutcomeMessage("failed").done, false);
  assert.match(paymentOutcomeMessage("failed").message, /not been charged/);
  assert.equal(paymentOutcomeMessage("review").done, true);
  assert.match(paymentOutcomeMessage("review").message, /don't pay again/);
  assert.equal(paymentOutcomeMessage("ignored").done, false);
  assert.doesNotMatch(paymentOutcomeMessage("ignored").message, /not been charged/);
});

test("the delivery phone is prefilled in Razorpay's +91 format, or left for Checkout to ask", () => {
  for (const phone of ["9876543210", "98765 43210", "+91 98765 43210", "09876543210", "919876543210"]) assert.equal(razorpayContact(phone), "+919876543210", phone);
  for (const phone of ["12345", "1876543210", ""]) assert.equal(razorpayContact(phone), undefined, phone);
});
