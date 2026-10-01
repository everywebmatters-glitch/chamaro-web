import type { Product } from "../../lib/products";
import ProductCard from "../ProductCard";

/* =========================================================
   PRODUCT GRID
   Fixed 4-column layout.
========================================================= */

export default function CatalogView({
  products,
  toolbarStart,
  toolbarEnd,
}: {
  products: Product[];
  toolbarStart: React.ReactNode;
  toolbarEnd: React.ReactNode;
}) {
  return (
    <>
      <div className="catalog-toolbar">
        <div className="catalog-toolbar-start">{toolbarStart}</div>
        <div className="catalog-toolbar-end">{toolbarEnd}</div>
      </div>

      <div className="catalog-grid" data-cols="4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} layout="grid" />
        ))}
      </div>
    </>
  );
}
