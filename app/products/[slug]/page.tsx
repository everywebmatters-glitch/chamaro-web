import type { Metadata } from "next";
import Header from "../../components/Header";
import ProductDetail, { type ProductResult } from "../../components/ProductDetail";
import SiteFooter from "../../components/SiteFooter";
import { fetchAllProducts, fetchProduct, toProduct } from "../../lib/catalog-api";
import { getRelatedProducts } from "../../lib/products";

/* Rendered fresh on every request: there's no generateStaticParams, so a slug Admin
   created a second ago works immediately, straight from the Fastify API. */
export const dynamic = "force-dynamic";

async function getProductResult(slug: string): Promise<ProductResult> {
  try {
    const api = await fetchProduct(slug);
    if (!api) return { status: "not-found" };
    const product = toProduct(api);
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
