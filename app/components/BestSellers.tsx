import Link from "next/link";
import { products, sortProducts } from "../lib/products";
import ProductCard from "./ProductCard";

const BEST_SELLER_COUNT = 4;

export default function BestSellers() {
  const bestSellers = sortProducts(products, "best-selling").slice(0, BEST_SELLER_COUNT);

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
