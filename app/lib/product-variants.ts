/* =========================================================
   PRODUCT VARIANTS
   Pure (no imports) so it can be unit-tested with `node --test`.
   Turns a product's API variants into the purchase box's choices.

   What Admin stores in a variant's `options` (the API accepts any JSON):
     Color / Colour   colour name, shown as a swatch ("Beige")
     ColorHex         optional exact swatch shade ("#c8a97e")
     images           optional media ids of this variant's own photos;
                      those photos are also product images (so the API
                      keeps their files) but only show for this variant
     compareAtPrice   optional struck-through price of this variant
     stock            optional units of this variant (the API enforces
                      only the product's total)
     anything else    the first other option (e.g. Size) becomes pills
   A colour value may also carry its shade inline: "Beige #C8A97E".
========================================================= */

export type VariantRow = {
  id?: string;
  name: string;
  sku?: string;
  /* Decimal string from the API; null = the product price */
  price?: string | number | null;
  options: Record<string, unknown>;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

/* One buyable variant, as the storefront uses it */
export type ChoiceVariant = {
  id: string;
  sku: string;
  name: string;
  /* undefined = sold at the product price */
  price?: number;
  compareAtPrice?: number;
  /* undefined = not counted per variant */
  stock?: number;
  color?: string;
  option?: string;
  /* Media ids of this variant's own photos, in Admin's order */
  imageIds: string[];
};

export type VariantChoices = {
  colors: { name: string; hex: string }[];
  /* The option's name as written in Admin ("Color" or "Colour") */
  colorLabel?: string;
  option?: { name: string; values: { label: string; available: boolean }[] };
  variants: ChoiceVariant[];
};

/* Swatch shades for colour names that come without a hex code */
const NAMED_SHADES: Record<string, string> = {
  beige: "#c8a97e",
  black: "#111111",
  blue: "#3b5b92",
  "light blue": "#a7bcd6",
  "sky blue": "#a7bcd6",
  navy: "#1f2a44",
  "navy blue": "#1f2a44",
  brown: "#5d3f2b",
  "dark brown": "#3e2a1e",
  tan: "#b5774a",
  camel: "#b98b5e",
  cream: "#efe6d2",
  "off white": "#f2efe8",
  white: "#ffffff",
  grey: "#8a8a8a",
  gray: "#8a8a8a",
  "light grey": "#c9c9c9",
  "light gray": "#c9c9c9",
  "dark grey": "#4a4a4a",
  "dark gray": "#4a4a4a",
  charcoal: "#36383b",
  red: "#b3261e",
  maroon: "#6d1f2a",
  burgundy: "#6d1f2a",
  green: "#3d6b4a",
  olive: "#6b6b3a",
  orange: "#d9772b",
  yellow: "#e2b93b",
  pink: "#e6a6b5",
  purple: "#6a4c93",
};

/* Unknown colour names still get a visible, neutral swatch */
const FALLBACK_SHADE = "#cccccc";

const COLOUR_KEY = /^colou?r$/i;
const HEX_KEY = /^colou?r ?hex$/i;
const IMAGES_KEY = "images";
const COMPARE_KEY = "compareAtPrice";
const STOCK_KEY = "stock";
/* Keys that hold data rather than a customer-facing option */
const DATA_KEYS = new Set([IMAGES_KEY, COMPARE_KEY, STOCK_KEY]);
const HEX = /#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/i;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

/* "Beige #C8A97E" → Beige + its hex; "Beige" → the named shade */
export function parseColour(value: string, explicitHex?: string) {
  const inline = value.match(HEX)?.[0];
  const name = value.replace(HEX, "").replace(/[()]/g, " ").replace(/\s+/g, " ").trim() || inline || value;
  const given = explicitHex && HEX.test(explicitHex) ? explicitHex.match(HEX)![0] : inline;
  return { name, hex: (given ?? NAMED_SHADES[name.toLowerCase()] ?? FALLBACK_SHADE).toLowerCase() };
}

/* Media ids listed under options.images (strings only) */
export function variantImageIds(options: Record<string, unknown> | null | undefined): string[] {
  const list = options?.[IMAGES_KEY];
  return Array.isArray(list) ? list.filter((id): id is string => typeof id === "string" && id.length > 0) : [];
}

/* Distinct values of one option across the variants, in first-seen order */
function valuesOf(variants: VariantRow[], key: string) {
  const seen = new Map<string, string>();
  for (const variant of variants) {
    const value = text(variant.options[key]);
    if (value && !seen.has(value.toLowerCase())) seen.set(value.toLowerCase(), value);
  }
  return [...seen.values()];
}

function priceOf(value: VariantRow["price"]) {
  if (value === null || value === undefined || value === "") return undefined;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

export function variantChoices(variants: VariantRow[]): VariantChoices {
  const active = variants.filter((variant) => variant.status === "ACTIVE");
  if (!active.length) return { colors: [], variants: [] };

  /* Option names in first-seen order; the shade and photo keys are data, not choices */
  const keys = [...new Set(active.flatMap((variant) => Object.keys(variant.options ?? {})))].filter(
    (key) => !DATA_KEYS.has(key) && !HEX_KEY.test(key) && valuesOf(active, key).length > 0
  );
  const colourKey = keys.find((key) => COLOUR_KEY.test(key));
  const otherKey = keys.find((key) => key !== colourKey);
  const hexKeyOf = (variant: VariantRow) => Object.keys(variant.options ?? {}).find((key) => HEX_KEY.test(key));

  const list: ChoiceVariant[] = active.map((variant, index) => {
    const colourValue = colourKey ? text(variant.options[colourKey]) : "";
    const hexKey = hexKeyOf(variant);
    const stock = priceOf(variant.options?.[STOCK_KEY] as VariantRow["price"]);
    const compareAtPrice = priceOf(variant.options?.[COMPARE_KEY] as VariantRow["price"]);
    return {
      id: variant.id ?? `variant-${index}`,
      sku: variant.sku ?? "",
      name: variant.name,
      price: priceOf(variant.price),
      ...(compareAtPrice !== undefined ? { compareAtPrice } : {}),
      ...(stock !== undefined ? { stock: Math.floor(stock) } : {}),
      color: colourValue ? parseColour(colourValue, hexKey ? text(variant.options[hexKey]) : undefined).name : undefined,
      option: otherKey ? text(variant.options[otherKey]) || undefined : keys.length ? undefined : variant.name,
      imageIds: variantImageIds(variant.options),
    };
  });

  /* Variants without Name: Value options: offer each variant by name, as before */
  if (!keys.length) {
    return {
      colors: [],
      option: { name: "Variant", values: active.map((variant) => ({ label: variant.name, available: true })) },
      variants: list,
    };
  }

  /* One swatch per colour; the first variant that gives a shade decides it */
  const colors = new Map<string, { name: string; hex: string }>();
  if (colourKey) {
    for (const variant of active) {
      const value = text(variant.options[colourKey]);
      if (!value) continue;
      const hexKey = hexKeyOf(variant);
      const colour = parseColour(value, hexKey ? text(variant.options[hexKey]) : undefined);
      if (!colors.has(colour.name.toLowerCase())) colors.set(colour.name.toLowerCase(), colour);
    }
  }

  return {
    colors: [...colors.values()],
    colorLabel: colourKey,
    option: otherKey
      ? { name: otherKey, values: valuesOf(active, otherKey).map((label) => ({ label, available: true })) }
      : undefined,
    variants: list,
  };
}

/* The variant for a colour/option choice. A missing choice matches anything, so picking
   only a colour still finds a variant when the product also has sizes. */
export function selectVariant<T extends Pick<ChoiceVariant, "color" | "option">>(
  variants: T[],
  color?: string,
  option?: string
): T | undefined {
  const same = (a?: string, b?: string) => (a ?? "").toLowerCase() === (b ?? "").toLowerCase();
  return (
    variants.find((v) => (!color || same(v.color, color)) && (!option || same(v.option, option))) ??
    variants.find((v) => !color || same(v.color, color))
  );
}
