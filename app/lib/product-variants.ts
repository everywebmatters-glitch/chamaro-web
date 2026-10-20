/* =========================================================
   PRODUCT VARIANTS
   Pure (no imports) so it can be unit-tested with `node --test`.
   Turns a product's API variants into the purchase box's choices:
   a "Colour"/"Color" option becomes round swatches, the first other
   option (e.g. Size) becomes pills. Admin writes options as Name: Value
   pairs; a colour value may carry its exact shade, e.g. "Beige #C8A97E".
========================================================= */

export type VariantRow = {
  name: string;
  options: Record<string, unknown>;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

export type VariantChoices = {
  colors: { name: string; hex: string }[];
  /* The option's name as written in Admin ("Color" or "Colour") */
  colorLabel?: string;
  option?: { name: string; values: { label: string; available: boolean }[] };
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
const HEX = /#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/i;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

/* "Beige #C8A97E" → Beige + its hex; "Beige" → the named shade */
export function parseColour(value: string) {
  const hex = value.match(HEX)?.[0];
  const name = value.replace(HEX, "").replace(/[()]/g, " ").replace(/\s+/g, " ").trim() || hex || value;
  return { name, hex: (hex ?? NAMED_SHADES[name.toLowerCase()] ?? FALLBACK_SHADE).toLowerCase() };
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

export function variantChoices(variants: VariantRow[]): VariantChoices {
  const active = variants.filter((variant) => variant.status === "ACTIVE");
  if (!active.length) return { colors: [] };

  /* Option names in first-seen order */
  const keys = [...new Set(active.flatMap((variant) => Object.keys(variant.options ?? {})))].filter(
    (key) => valuesOf(active, key).length > 0
  );

  /* Variants without Name: Value options: offer each variant by name, as before */
  if (!keys.length) {
    return {
      colors: [],
      option: { name: "Variant", values: active.map((variant) => ({ label: variant.name, available: true })) },
    };
  }

  const colourKey = keys.find((key) => COLOUR_KEY.test(key));
  const otherKey = keys.find((key) => key !== colourKey);

  return {
    colors: colourKey ? valuesOf(active, colourKey).map(parseColour) : [],
    colorLabel: colourKey,
    option: otherKey
      ? { name: otherKey, values: valuesOf(active, otherKey).map((label) => ({ label, available: true })) }
      : undefined,
  };
}
