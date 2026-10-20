import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_INFO_BOXES, toInfoBoxes } from "../app/lib/product-info.ts";

test("nothing from the admin keeps the store's own two boxes", () => {
  for (const value of [null, undefined, [], "x", [null, 5]]) assert.deepEqual(toInfoBoxes(value), DEFAULT_INFO_BOXES);
});

test("a box the admin wrote is shown as written; an empty one keeps the default", () => {
  const boxes = toInfoBoxes([{ title: " Shipping ", text: " Free over ₹5000 " }, { title: "", text: "" }]);
  assert.deepEqual(boxes[0], { title: "Shipping", text: "Free over ₹5000" });
  assert.deepEqual(boxes[1], DEFAULT_INFO_BOXES[1]);
});

test("a heading alone keeps the standard text, and text alone keeps the standard heading", () => {
  const boxes = toInfoBoxes([{ title: "Installation", text: "" }, { title: "", text: "Easy returns" }]);
  assert.deepEqual(boxes[0], { title: "Installation", text: DEFAULT_INFO_BOXES[0].text });
  assert.deepEqual(boxes[1], { title: DEFAULT_INFO_BOXES[1].title, text: "Easy returns" });
});

test("overlong values are cut to the admin's limits", () => {
  const [box] = toInfoBoxes([{ title: "t".repeat(100), text: "x".repeat(2000) }]);
  assert.equal(box.title.length, 60);
  assert.equal(box.text.length, 1000);
});
