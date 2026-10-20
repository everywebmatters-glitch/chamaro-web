/* =========================================================
   PRODUCT INFO BOXES
   Pure (no imports) so it can be unit-tested with `node --test`.
   The two Delivery & Return boxes on a product page are written by the admin per product, each with its own
   heading and text (shipping, returns or anything else). A box left empty shows the store's own wording.
========================================================= */

export type InfoBox = { title: string; text: string };

export const DEFAULT_INFO_BOXES: [InfoBox, InfoBox] = [
  { title: "Delivery", text: "Estimated delivery: 3–7 days (metro cities), 7–12 days (rest of India)." },
  { title: "Returns", text: "Return within 7 days of delivery in original packaging. Assembly and shipping charges are non-refundable." },
];

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function toInfoBoxes(value: unknown): [InfoBox, InfoBox] {
  const list = Array.isArray(value) ? value : [];
  const at = (index: 0 | 1): InfoBox => {
    const entry = list[index];
    const item = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    const title = clean(item.title, 60);
    const text = clean(item.text, 1000);
    /* A box the admin filled in is shown as written; a heading alone keeps the standard text under it */
    if (!title && !text) return DEFAULT_INFO_BOXES[index];
    return { title: title || DEFAULT_INFO_BOXES[index].title, text: text || DEFAULT_INFO_BOXES[index].text };
  };
  return [at(0), at(1)];
}
