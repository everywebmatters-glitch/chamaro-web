import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "../components/Header";
import ServiceHighlights from "../components/ServiceHighlights";
import SiteFooter from "../components/SiteFooter";
import ProductsCatalog, {
  ProductsCatalogContent,
} from "../components/catalog/ProductsCatalog";

export const metadata: Metadata = {
  title: "Office Chairs | Chamaro",
  description:
    "Shop boss, executive, visitor and cafe chairs designed for comfort, style and everyday performance.",
};

export default function ProductsPage() {
  return (
    <div className="site-shell">
      <Header />

      <main>
        {/* Prerendered unfiltered; the query string is applied in the browser */}
        <Suspense fallback={<ProductsCatalogContent searchParams={new URLSearchParams()} />}>
          <ProductsCatalog />
        </Suspense>

        <ServiceHighlights />
      </main>

      <SiteFooter />
    </div>
  );
}
