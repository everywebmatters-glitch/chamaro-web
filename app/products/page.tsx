import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import Header from "../components/Header";
import ServiceHighlights from "../components/ServiceHighlights";
import SiteFooter from "../components/SiteFooter";
import SortSelect from "../components/SortSelect";
import CatalogView from "../components/catalog/CatalogView";
import FilterDrawer from "../components/catalog/FilterDrawer";
import Pagination from "../components/catalog/Pagination";
import {
  allColors,
  categories,
  getCategoryName,
  PRICE_RANGES,
  products,
  sortOptions,
  sortProducts,
  type Product,
  type SortOption,
} from "../lib/products";

export const metadata: Metadata = {
  title: "Office Chairs | Chamaro",
  description:
    "Shop boss, executive, visitor and cafe chairs designed for comfort, style and everyday performance.",
};

const PAGE_SIZE = 12;

type Filters = {
  category?: string;
  price?: string;
  color?: string;
  sort: SortOption;
  page: number;
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function applyFilters(items: Product[], filters: Omit<Filters, "sort" | "page">) {
  const range = PRICE_RANGES.find((item) => item.value === filters.price);

  return items.filter(
    (product) =>
      (!filters.category || product.category === filters.category) &&
      (!range || (product.price >= range.min && product.price < range.max)) &&
      (!filters.color || product.colors.some((color) => color.name === filters.color))
  );
}

export default async function ProductsPage(props: PageProps<"/products">) {
  const searchParams = await props.searchParams;

  /* Validate every param against known values */
  const categoryParam = readParam(searchParams.category);
  const priceParam = readParam(searchParams.price);
  const colorParam = readParam(searchParams.color);
  const sortParam = readParam(searchParams.sort);
  const colors = allColors();

  const filters: Filters = {
    category: categories.some((item) => item.slug === categoryParam) ? categoryParam : undefined,
    price: PRICE_RANGES.some((item) => item.value === priceParam) ? priceParam : undefined,
    color: colors.some((item) => item.name === colorParam) ? colorParam : undefined,
    sort: sortOptions.some((option) => option.value === sortParam)
      ? (sortParam as SortOption)
      : "featured",
    page: Math.max(1, Number.parseInt(readParam(searchParams.page) ?? "1", 10) || 1),
  };

  /* Build a URL from the current filters plus overrides; filters reset paging */
  const hrefWith = (overrides: Partial<Filters>) => {
    const next = { ...filters, page: 1, ...overrides };
    const params = new URLSearchParams();
    if (next.category) params.set("category", next.category);
    if (next.price) params.set("price", next.price);
    if (next.color) params.set("color", next.color);
    if (next.sort !== "featured") params.set("sort", next.sort);
    if (next.page > 1) params.set("page", String(next.page));
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  };

  const filtered = sortProducts(applyFilters(products, filters), filters.sort);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCount = [filters.category, filters.price, filters.color].filter(Boolean).length;
  const title = filters.category ? `${getCategoryName(filters.category)} Chairs` : "All Products";

  /* Counts shown next to each filter, respecting the other active filters */
  const countFor = (overrides: Partial<Filters>) =>
    applyFilters(products, { ...filters, ...overrides }).length;

  const filterPanel = (
    <>
      <div className="filter-group">
        <h3>Category</h3>
        <ul>
          <li>
            <Link
              href={hrefWith({ category: undefined })}
              className={filters.category ? "" : "selected"}
            >
              <span className="filter-check">{!filters.category && <Check size={12} />}</span>
              All
              <small>{countFor({ category: undefined })}</small>
            </Link>
          </li>
          {categories.map((category) => {
            const selected = filters.category === category.slug;
            return (
              <li key={category.slug}>
                <Link
                  href={hrefWith({ category: selected ? undefined : category.slug })}
                  className={selected ? "selected" : ""}
                  aria-current={selected ? "true" : undefined}
                >
                  <span className="filter-check">{selected && <Check size={12} />}</span>
                  {category.name}
                  <small>{countFor({ category: category.slug })}</small>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="filter-group">
        <h3>Price</h3>
        <ul>
          {PRICE_RANGES.map((range) => {
            const selected = filters.price === range.value;
            return (
              <li key={range.value}>
                <Link
                  href={hrefWith({ price: selected ? undefined : range.value })}
                  className={selected ? "selected" : ""}
                  aria-current={selected ? "true" : undefined}
                >
                  <span className="filter-check">{selected && <Check size={12} />}</span>
                  {range.label}
                  <small>{countFor({ price: range.value })}</small>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="filter-group">
        <h3>Colour</h3>
        <ul>
          {colors.map((color) => {
            const selected = filters.color === color.name;
            return (
              <li key={color.name}>
                <Link
                  href={hrefWith({ color: selected ? undefined : color.name })}
                  className={selected ? "selected" : ""}
                  aria-current={selected ? "true" : undefined}
                >
                  <span className="filter-swatch" style={{ background: color.hex }} />
                  {color.name}
                  <small>{countFor({ color: color.name })}</small>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {activeCount > 0 && (
        <Link
          href={hrefWith({ category: undefined, price: undefined, color: undefined })}
          className="filter-clear"
        >
          Clear all filters
        </Link>
      )}
    </>
  );

  return (
    <div className="site-shell">
      <Header />

      <main>
        {/* Page heading */}

        <section className="page-hero" aria-labelledby="products-title">
          <div className="page-hero-inner">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <ol>
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li aria-current={filters.category ? undefined : "page"}>
                  {filters.category ? <Link href="/products">Products</Link> : "Products"}
                </li>
                {filters.category && (
                  <li aria-current="page">{getCategoryName(filters.category)}</li>
                )}
              </ol>
            </nav>

            <h1 id="products-title">{title}</h1>

            <p>
              Thoughtfully crafted seating for every workspace — from leadership cabins to cafés
              and meeting rooms.
            </p>
          </div>
        </section>

        {/* Toolbar + grid */}

        <section className="catalog" aria-label="Product list">
          <CatalogView
            products={pageItems}
            toolbarStart={<FilterDrawer activeCount={activeCount}>{filterPanel}</FilterDrawer>}
            toolbarEnd={<SortSelect value={filters.sort} />}
          />

          {filtered.length === 0 && (
            <div className="catalog-empty">
              <h2>No chairs match these filters</h2>
              <p>Try removing a filter to see more of the collection.</p>
              <Link href="/products" className="see-more-button">
                View all products
              </Link>
            </div>
          )}

          {filtered.length > 0 && (
            <p className="catalog-count">
              Showing {pageItems.length} of {filtered.length}{" "}
              {filtered.length === 1 ? "product" : "products"}
            </p>
          )}

          <Pagination
            current={page}
            total={totalPages}
            hrefFor={(target) => hrefWith({ page: target })}
          />
        </section>

        <ServiceHighlights />
      </main>

      <SiteFooter />
    </div>
  );
}
