import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductCard, { StarRating } from "./ProductCard";
import ProductGallery from "./ProductGallery";
import ProductPurchase from "./ProductPurchase";
import ReloadButton from "./ReloadButton";
import ProductTabs from "./ProductTabs";
import { availabilityLabels, discountPercent, formatPrice, type Product } from "../lib/products";

/* =========================================================
   PRODUCT DETAIL
   Rendered server-side on every request (app/products/[slug]/page.tsx fetches live
   from the Fastify API with no caching), so this just renders whatever that fetch found.
========================================================= */

export type ProductResult =
  | { status: "ready"; product: Product; related: Product[] }
  | { status: "not-found" }
  | { status: "error" };

export default function ProductDetail({ result }: { result: ProductResult }) {
  if (result.status === "not-found") {
    return (
      <div className="product-page">
        <div className="catalog-empty">
          <h2>Product not found</h2>
          <p>This product is no longer available. It may have been removed or is not on sale right now.</p>
          <Link href="/products" className="see-more-button">
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="product-page">
        <div className="catalog-empty" role="alert">
          <h2>We couldn&apos;t load this product</h2>
          <p>Please check your connection and try again in a moment.</p>
          <ReloadButton />
        </div>
      </div>
    );
  }

  const { product, related } = result;
  const discount = discountPercent(product);

  return (
    <>
      <div className="product-page">
        <nav className="breadcrumbs breadcrumbs-chevron" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/">Home</Link>
              <ChevronRight size={14} aria-hidden="true" />
            </li>
            <li>
              <Link href={`/products?category=${product.category}`}>{product.categoryName}</Link>
              <ChevronRight size={14} aria-hidden="true" />
            </li>
            <li aria-current="page">{product.name}</li>
          </ol>
        </nav>

        {/* Gallery + summary */}

        <div className="product-layout">
          <ProductGallery key={product.slug} images={product.images} />

          <div className="product-summary">
            <h1>{product.name}</h1>

            <div className="product-summary-meta">
              <span className={`stock-badge stock-${product.availability}`}>
                {availabilityLabels[product.availability]}
              </span>
              <StarRating rating={product.rating} reviewCount={product.reviewCount} />
            </div>

            <div className="product-price-row product-price-large">
              <span className="price-current">{formatPrice(product.price)}</span>

              {product.compareAtPrice && (
                <s className="price-original">{formatPrice(product.compareAtPrice)}</s>
              )}

              {discount > 0 && <span className="price-save">{discount}% OFF</span>}
            </div>

            <p className="product-lede">{product.shortDescription}</p>

            {/* Keyed so the selected option/quantity reset if the product data changes */}
            <ProductPurchase key={`${product.slug}:${product.price}`} product={product} />
          </div>
        </div>

        <ProductTabs product={product} />
      </div>

      {/* Related */}

      {related.length > 0 && (
        <section className="related-products" aria-labelledby="related-title">
          <h2 id="related-title">You May Also Like</h2>

          <div className="catalog-grid" data-cols="4">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
