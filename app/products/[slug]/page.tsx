import type { Metadata } from "next";
import Header from "../../components/Header";
import ProductDetail from "../../components/ProductDetail";
import SiteFooter from "../../components/SiteFooter";
import { fetchAllProducts, fetchProduct, SHELL_SLUG, toProduct } from "../../lib/catalog-api";
import { getRelatedProducts } from "../../lib/products";

/* Only the slugs below are exported; anything else is the static 404 page */
export const dynamicParams = false;

/* Runs at build time (static export). Every active product gets a prerendered page, plus
   one shell page (/products/_/) that public/.htaccess serves for products created after the
   build; ProductDetail then loads those from the API in the browser. */
export async function generateStaticParams() {
  const products = await fetchAllProducts();
  return [...products.map((product) => ({ slug: product.slug })), { slug: SHELL_SLUG }];
}

async function getProduct(slug: string) {
  if (slug === SHELL_SLUG) return undefined;
  const product = await fetchProduct(slug);
  return product ? toProduct(product) : undefined;
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: "Product | Chamaro" };
  }

  return {
    title: `${product.name} | Chamaro`,
    description: product.shortDescription,
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  const initial = product
    ? { product, related: getRelatedProducts(product, (await fetchAllProducts()).map(toProduct)) }
    : null;

  return (
    <div className="site-shell">
      <Header />

      <main>
        <ProductDetail initial={initial} slug={slug} />
      </main>

      <SiteFooter />
    </div>
  );
}
