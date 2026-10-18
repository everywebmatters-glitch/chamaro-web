/* =========================================================
   CART RECONCILIATION
   Pure (no imports) so it can be unit-tested with `node --test`.
   Matches a saved cart against the live catalog: lines whose product
   is gone or out of stock are removed, quantities are trimmed to the
   units left, and each change is explained to the shopper.
========================================================= */

type Line = { slug: string; quantity: number };
type CatalogEntry = { slug: string; name: string; stockLeft?: number };

export function reconcileCart<L extends Line>(cart: L[], catalog: CatalogEntry[]): { cart: L[]; notices: string[] } {
  const bySlug = new Map(catalog.map((product) => [product.slug, product]));
  const notices: string[] = [];
  const next: L[] = [];
  let missing = 0;

  for (const line of cart) {
    const product = bySlug.get(line.slug);
    const left = product?.stockLeft;
    if (!product) missing += 1;
    else if (left !== undefined && left <= 0) notices.push(`${product.name} is out of stock and was removed from your cart.`);
    else if (left !== undefined && line.quantity > left) {
      notices.push(`Only ${left} of ${product.name} ${left === 1 ? "is" : "are"} available, so we reduced the quantity.`);
      next.push({ ...line, quantity: left });
    } else next.push(line);
  }

  if (missing) {
    notices.unshift(
      `${missing === 1 ? "A product" : `${missing} products`} in your cart ${missing === 1 ? "is" : "are"} no longer available and ${missing === 1 ? "was" : "were"} removed.`
    );
  }
  return { cart: next, notices };
}
