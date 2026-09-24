import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Header from "../../components/Header";
import ProductCard, { StarRating } from "../../components/ProductCard";
import ProductGallery from "../../components/ProductGallery";
import ProductPurchase from "../../components/ProductPurchase";
import ProductTabs from "../../components/ProductTabs";
import SiteFooter from "../../components/SiteFooter";
import {
  availabilityLabels,
  discountPercent,
  formatPrice,
  getCategoryName,
  getProduct,
  getRelatedProducts,
  products,
} from "../../lib/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProduct(slug);

  if (!product) {
    return { title: "Product not found | Chamaro" };
  }

  return {
    title: `${product.name} | Chamaro`,
    description: product.shortDescription,
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  const discount = discountPercent(product);
  const categoryName = getCategoryName(product.category);
  const related = getRelatedProducts(product);

  return (
    <div className="site-shell">
      <Header />

      <main>
        <div className="product-page">
          <nav className="breadcrumbs breadcrumbs-chevron" aria-label="Breadcrumb">
            <ol>
              <li>
                <Link href="/">Home</Link>
                <ChevronRight size={14} aria-hidden="true" />
              </li>
              <li>
                <Link href={`/products?category=${product.category}`}>{categoryName}</Link>
                <ChevronRight size={14} aria-hidden="true" />
              </li>
              <li aria-current="page">{product.name}</li>
            </ol>
          </nav>

          {/* Gallery + summary */}

          <div className="product-layout">
            <ProductGallery images={product.images} />

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

              <ProductPurchase product={product} />
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
      </main>

      <SiteFooter />
    </div>
  );
}
