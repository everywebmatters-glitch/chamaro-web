import Link from "next/link";
import { getBestSellers } from "../lib/catalog-api";
import ProductCard from "./ProductCard";

/* "Best Sellers" are the products the admin picked. With none picked, or if the API can't be reached,
   the section is left out. */
export default async function BestSellers() {
  const bestSellers = await getBestSellers();
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
