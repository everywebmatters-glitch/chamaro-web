"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import ProductCard, { StarRating } from "./ProductCard";
import ProductGallery from "./ProductGallery";
import ProductPurchase from "./ProductPurchase";
import ProductTabs from "./ProductTabs";
import { fetchProduct, fetchProducts, SHELL_SLUG, toProduct } from "../lib/catalog-api";
import {
  availabilityLabels,
  discountPercent,
  formatPrice,
  getRelatedProducts,
  type Product,
} from "../lib/products";

/* =========================================================
   PRODUCT DETAIL
   Prerendered with build-time data where available, then
   re-read from GET /api/v1/products/{slug} in the browser, so
   price/stock edits, unpublishing and deletes in Admin show up
   without a rebuild. The API only returns ACTIVE products.
========================================================= */

type State =
  | { status: "loading" }
  | { status: "ready"; product: Product; related: Product[] }
  | { status: "not-found" }
  | { status: "error" };

/* /products/{slug}/ → slug (the shell page is served under the requested URL) */
function slugFromLocation() {
  const match = window.location.pathname.match(/^\/products\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function ProductDetail({
  initial,
  slug,
}: {
  /* Build-time product; null on the shell page */
  initial: { product: Product; related: Product[] } | null;
  /* Build-time slug; SHELL_SLUG means "read it from the URL" */
  slug: string;
}) {
  const [state, setState] = useState<State>(
    initial ? { status: "ready", ...initial } : { status: "loading" }
  );

  useEffect(() => {
    let cancelled = false;
    const target = slug === SHELL_SLUG ? slugFromLocation() : slug;

    async function load() {
      if (!target || target === SHELL_SLUG) return { status: "not-found" } as const;
      const api = await fetchProduct(target);
      if (!api) return { status: "not-found" } as const;
      const product = toProduct(api);
      /* Same category first, then the rest (getRelatedProducts drops this product) */
      const { data } = await fetchProducts({ limit: 12 });
      const catalog = data.map(toProduct);
      return { status: "ready", product, related: getRelatedProducts(product, catalog) } as const;
    }

    load()
      .then((next) => {
        if (cancelled) return;
        setState(next);
        if (next.status === "ready") document.title = `${next.product.name} | Chamaro`;
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.status === "loading") {
    return (
      <div className="product-page">
        <div className="catalog-empty" role="status">
          <p>Loading product…</p>
        </div>
      </div>
    );
  }

  if (state.status === "not-found") {
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

  if (state.status === "error") {
    return (
      <div className="product-page">
        <div className="catalog-empty" role="alert">
          <h2>We couldn&apos;t load this product</h2>
          <p>Please check your connection and try again in a moment.</p>
          <button type="button" className="see-more-button" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { product, related } = state;
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
