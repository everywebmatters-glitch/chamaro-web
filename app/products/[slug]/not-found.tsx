import Link from "next/link";
import Header from "../../components/Header";
import SiteFooter from "../../components/SiteFooter";

/* Shown (with a real 404 status) when /products/{slug} names no active product */
export default function ProductNotFound() {
  return (
    <div className="site-shell">
      <Header />

      <main>
        <div className="product-page">
          <div className="catalog-empty">
            <h2>Product not found</h2>
            <p>This product is no longer available. It may have been removed or is not on sale right now.</p>
            <Link href="/products" className="see-more-button">
              Browse all products
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
