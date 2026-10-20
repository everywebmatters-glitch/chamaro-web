import test from "node:test";
import assert from "node:assert/strict";
import { parseColour, variantChoices, type VariantRow } from "../app/lib/product-variants.ts";

const v = (name: string, options: Record<string, unknown>, status: VariantRow["status"] = "ACTIVE"): VariantRow => ({
  name,
  options,
  status,
});

test("colour options become swatches named as in Admin", () => {
  const choices = variantChoices([
    v("Beige", { Color: "Beige" }),
    v("Black", { Color: "Black" }),
    v("Blue", { Color: "Light Blue" }),
  ]);
  assert.equal(choices.colorLabel, "Color");
  assert.deepEqual(choices.colors, [
    { name: "Beige", hex: "#c8a97e" },
    { name: "Black", hex: "#111111" },
    { name: "Light Blue", hex: "#a7bcd6" },
  ]);
  assert.equal(choices.option, undefined);
});

test("a hex code in the value sets the exact shade", () => {
  assert.deepEqual(parseColour("Sand #D2B48C"), { name: "Sand", hex: "#d2b48c" });
  assert.deepEqual(parseColour("Sand (#d2b48c)"), { name: "Sand", hex: "#d2b48c" });
  assert.deepEqual(parseColour("Mystery"), { name: "Mystery", hex: "#cccccc" });
});

test("colour and another option: swatches plus pills, duplicates merged", () => {
  const choices = variantChoices([
    v("Black / M", { Colour: "Black", Size: "M" }),
    v("Black / L", { Colour: "Black", Size: "L" }),
    v("Grey / M", { colour: "grey", Size: "M" }),
  ]);
  assert.equal(choices.colorLabel, "Colour");
  assert.deepEqual(choices.colors.map((c) => c.name), ["Black"]);
  assert.deepEqual(choices.option, {
    name: "Size",
    values: [
      { label: "M", available: true },
      { label: "L", available: true },
    ],
  });
});

test("inactive variants are not offered", () => {
  const choices = variantChoices([v("Beige", { Color: "Beige" }), v("Red", { Color: "Red" }, "DRAFT")]);
  assert.deepEqual(choices.colors.map((c) => c.name), ["Beige"]);
  assert.deepEqual(variantChoices([v("Red", { Color: "Red" }, "ARCHIVED")]), { colors: [] });
});

test("variants without options keep the variant-name pills", () => {
  const choices = variantChoices([v("Standard", {}), v("Premium", {})]);
  assert.deepEqual(choices.colors, []);
  assert.deepEqual(choices.option?.values.map((value) => value.label), ["Standard", "Premium"]);
});
