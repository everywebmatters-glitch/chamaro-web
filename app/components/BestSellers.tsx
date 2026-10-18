import Link from "next/link";
import { getNewestProducts } from "../lib/catalog-api";
import ProductCard from "./ProductCard";

const BEST_SELLER_COUNT = 4;

/* Until there is real sales data, "Best Sellers" are the newest active products in the live catalog.
   If the catalog is empty or the API can't be reached the section is left out. */
export default async function BestSellers() {
  const bestSellers = await getNewestProducts(BEST_SELLER_COUNT);
  if (bestSellers.length === 0) return null;

  return (
    <section className="best-sellers" aria-labelledby="best-sellers-title">
      <div className="best-sellers-header">
        <h2 id="best-sellers-title">Best Sellers</h2>
      </div>

      <div className="catalog-grid" data-cols="4">
        {bestSellers.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>

      <div className="best-sellers-footer">
        <Link href="/products?sort=best-selling" className="see-more-button">
          See More
        </Link>
      </div>
    </section>
  );
}
