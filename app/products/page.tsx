import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "../components/Header";
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

/* Skip build-time prerendering entirely: a no-store fetch can't be statically generated,
   and the build machine may not even have network access to the API. */
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  /* fetchAllProducts/fetchCategories fetch with no-store, so this renders fresh per request */
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
      </main>

      <SiteFooter />
    </div>
  );
}
