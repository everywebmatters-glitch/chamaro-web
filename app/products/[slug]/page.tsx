import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import ProductDetail, { type ProductResult } from "../../components/ProductDetail";
import SiteFooter from "../../components/SiteFooter";
import { fetchAllProducts, fetchProduct, toProduct } from "../../lib/catalog-api";
import { getRelatedProducts } from "../../lib/products";
import { getReviewSummary } from "../../lib/reviews-api";

/* Rendered fresh on every request: there's no generateStaticParams, so a slug Admin
   created a second ago works immediately, straight from the Fastify API. */
export const dynamic = "force-dynamic";

async function getProductResult(slug: string): Promise<ProductResult> {
  try {
    const api = await fetchProduct(slug);
    if (!api) return { status: "not-found" };
    const summary = await getReviewSummary(slug);
    const product = { ...toProduct(api), rating: summary.average, reviewCount: summary.count };
    const catalog = (await fetchAllProducts()).map(toProduct);
    return { status: "ready", product, related: getRelatedProducts(product, catalog) };
  } catch {
    return { status: "error" };
  }
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const result = await getProductResult(slug);

  if (result.status !== "ready") {
    return { title: "Product | Chamaro" };
  }

  return {
    title: `${result.product.name} | Chamaro`,
    description: result.product.shortDescription,
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const result = await getProductResult(slug);
  /* A real 404 status (not a 200 page that says "not found") for unknown or inactive slugs */
  if (result.status === "not-found") notFound();

  return (
    <div className="site-shell">
      <Header />

      <main>
        <ProductDetail result={result} />
      </main>

      <SiteFooter />
    </div>
  );
}
