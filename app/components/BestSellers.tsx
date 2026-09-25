import Link from "next/link";
import { products, sortProducts } from "../lib/products";
import ProductCard from "./ProductCard";

const BEST_SELLER_COUNT = 4;

/* This section's own photography (public/products/best-seller-*.svg) — swapped
   in for just these 4 cards, without touching the shared catalogue data used
   on product detail pages, related products, etc. */
const BEST_SELLER_IMAGES = [
  "/products/best-seller-1.svg",
  "/products/best-seller-2.svg",
  "/products/best-seller-3.svg",
  "/products/best-seller-4.svg",
];

export default function BestSellers() {
  const bestSellers = sortProducts(products, "best-selling")
    .slice(0, BEST_SELLER_COUNT)
    .map((product, index) => ({
      ...product,
      images: [{ src: BEST_SELLER_IMAGES[index], alt: product.name }],
    }));

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
