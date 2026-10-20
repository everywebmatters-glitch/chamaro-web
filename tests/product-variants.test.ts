import test from "node:test";
import assert from "node:assert/strict";
import { parseColour, selectVariant, variantChoices, variantImageIds, type VariantRow } from "../app/lib/product-variants.ts";

const v = (name: string, options: Record<string, unknown>, extra: Partial<VariantRow> = {}): VariantRow => ({
  id: `id-${name}`,
  name,
  sku: `SKU-${name}`,
  price: null,
  options,
  status: "ACTIVE",
  ...extra,
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

test("a hex code in the value or in ColorHex sets the exact shade", () => {
  assert.deepEqual(parseColour("Sand #D2B48C"), { name: "Sand", hex: "#d2b48c" });
  assert.deepEqual(parseColour("Sand (#d2b48c)"), { name: "Sand", hex: "#d2b48c" });
  assert.deepEqual(parseColour("Mystery"), { name: "Mystery", hex: "#cccccc" });
  const choices = variantChoices([v("Sand", { Color: "Sand", ColorHex: "#AA5500" })]);
  assert.deepEqual(choices.colors, [{ name: "Sand", hex: "#aa5500" }]);
});

test("ColorHex and images are data, never shown as options", () => {
  const choices = variantChoices([v("Beige", { Color: "Beige", ColorHex: "#c8a97e", images: ["m1", "m2"] })]);
  assert.equal(choices.option, undefined);
  assert.deepEqual(choices.variants[0].imageIds, ["m1", "m2"]);
});

test("compare-at price and stock are read from options and never shown as options", () => {
  const choices = variantChoices([v("Beige", { Color: "Beige", compareAtPrice: 9999, stock: 4 }, { price: "7499.00" })]);
  assert.equal(choices.option, undefined);
  assert.equal(choices.variants[0].compareAtPrice, 9999);
  assert.equal(choices.variants[0].stock, 4);
  assert.equal(variantChoices([v("Black", { Color: "Black" })]).variants[0].stock, undefined);
});

test("variants and swatches follow the admin's position order", () => {
  const choices = variantChoices([
    v("Beige", { Color: "Beige", position: 2 }),
    v("Black", { Color: "Black", position: 0 }),
    v("Grey", { Color: "Grey" }),
    v("Brown", { Color: "Brown", position: 1 }),
  ]);
  assert.deepEqual(choices.colors.map((c) => c.name), ["Black", "Brown", "Beige", "Grey"]);
  assert.deepEqual(choices.variants.map((variant) => variant.name), ["Black", "Brown", "Beige", "Grey"]);
  assert.equal(choices.option, undefined);
});

test("each variant keeps its id, SKU, price and colour", () => {
  const choices = variantChoices([
    v("Beige", { Color: "Beige" }, { price: "7499.00" }),
    v("Black", { Color: "Black" }),
  ]);
  assert.deepEqual(
    choices.variants.map(({ id, sku, price, color }) => ({ id, sku, price, color })),
    [
      { id: "id-Beige", sku: "SKU-Beige", price: 7499, color: "Beige" },
      { id: "id-Black", sku: "SKU-Black", price: undefined, color: "Black" },
    ]
  );
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

test("selectVariant matches colour and option, falling back to the colour alone", () => {
  const { variants } = variantChoices([
    v("Black / M", { Color: "Black", Size: "M" }),
    v("Black / L", { Color: "Black", Size: "L" }),
    v("Beige / M", { Color: "Beige", Size: "M" }),
  ]);
  assert.equal(selectVariant(variants, "Black", "L")?.name, "Black / L");
  assert.equal(selectVariant(variants, "beige", "M")?.name, "Beige / M");
  assert.equal(selectVariant(variants, "Beige", "L")?.name, "Beige / M");
  assert.equal(selectVariant(variants, "Red", "M"), undefined);
});

test("inactive variants are not offered", () => {
  const choices = variantChoices([v("Beige", { Color: "Beige" }), v("Red", { Color: "Red" }, { status: "DRAFT" })]);
  assert.deepEqual(choices.colors.map((c) => c.name), ["Beige"]);
  assert.deepEqual(variantChoices([v("Red", { Color: "Red" }, { status: "ARCHIVED" })]), { colors: [], variants: [] });
});

test("variants without options keep the variant-name pills", () => {
  const choices = variantChoices([v("Standard", {}), v("Premium", {})]);
  assert.deepEqual(choices.colors, []);
  assert.deepEqual(choices.option?.values.map((value) => value.label), ["Standard", "Premium"]);
  assert.equal(selectVariant(choices.variants, undefined, "Premium")?.name, "Premium");
});

test("variantImageIds ignores anything that isn't a list of ids", () => {
  assert.deepEqual(variantImageIds({ images: ["a", 3, "", "b"] }), ["a", "b"]);
  assert.deepEqual(variantImageIds({ images: "a" }), []);
  assert.deepEqual(variantImageIds(null), []);
});
