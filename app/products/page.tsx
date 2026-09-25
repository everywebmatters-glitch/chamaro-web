import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "../components/Header";
import ServiceHighlights from "../components/ServiceHighlights";
import SiteFooter from "../components/SiteFooter";
import ProductsCatalog, {
  ProductsCatalogContent,
} from "../components/catalog/ProductsCatalog";
import { fetchAllProducts, fetchCategories, toProduct } from "../lib/catalog-api";

export const metadata: Metadata = {
  title: "Office Chairs | Chamaro",
  description:
    "Shop boss, executive, visitor and cafe chairs designed for comfort, style and everyday performance.",
};

export default async function ProductsPage() {
  /* Runs at build time (static export); rebuild to pick up catalog changes */
  const [apiProducts, apiCategories] = await Promise.all([fetchAllProducts(), fetchCategories()]);
  const catalog = {
    products: apiProducts.map(toProduct),
    categories: apiCategories.map(({ slug, name }) => ({ slug, name })),
  };

  return (
    <div className="site-shell">
      <Header />

      <main>
        {/* Prerendered unfiltered; the query string is applied in the browser */}
        <Suspense fallback={<ProductsCatalogContent {...catalog} />}>
          <ProductsCatalog {...catalog} />
        </Suspense>

        <ServiceHighlights />
      </main>

      <SiteFooter />
    </div>
  );
}
