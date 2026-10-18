"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, LayoutGrid, Search } from "lucide-react";
import { useState } from "react";
import { categoryHref, categoryIcon, searchCatalog } from "../lib/catalog-nav";
import Modal from "./Modal";
import ProductCard from "./ProductCard";
import { useStore } from "./store/StoreProvider";

/* Product shown while the search box is empty: the newest ones in the live catalog */
const INSPIRATION_COUNT = 4;

export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { catalog, catalogFailed, categories } = useStore();
  const [query, setQuery] = useState("");
  const results = searchCatalog(catalog, query);
  const hasQuery = query.trim().length > 0;
  const loading = !catalog && !catalogFailed;
  const inspiration = catalog?.slice(0, INSPIRATION_COUNT) ?? [];

  const close = () => {
    setQuery("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Search our site"
      className="search-overlay"
    >
      {/* Only build the panel while open so hidden cards aren't in every page */}
      {open && (
        <>
          <h2 className="search-title">Search our site</h2>

          <form
            className="search-field"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <Search size={20} strokeWidth={2} aria-hidden="true" />
            <label className="sr-only" htmlFor="site-search">
              Search products
            </label>
            <input
              id="site-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products by name, category or SKU"
              autoComplete="off"
              autoFocus
            />
          </form>

          <div className="search-layout">
            <nav
              className="search-quick-links"
              aria-labelledby="quick-link-title"
            >
              <h3 id="quick-link-title">Quick Links</h3>
              <ul>
                <li>
                  <Link href="/products" onClick={close}>
                    <span className="search-quick-link-icon">
                      <LayoutGrid size={18} strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <span className="search-quick-link-name">All Products</span>
                    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                  </Link>
                </li>
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link href={categoryHref(category.slug)} onClick={close}>
                      <span className="search-quick-link-icon">
                        <Image src={categoryIcon(category.slug)} alt="" width={20} height={20} />
                      </span>
                      <span className="search-quick-link-name">{category.name}</span>
                      <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <section className="search-results" aria-live="polite">
              <h3>
                {hasQuery && catalog
                  ? `${results.length} ${results.length === 1 ? "result" : "results"} for “${query.trim()}”`
                  : "Need some inspiration?"}
              </h3>

              {catalogFailed ? (
                <p className="search-empty">
                  Search isn&apos;t available right now. Please check your connection and try
                  again, or browse <Link href="/products" onClick={close}>all products</Link>.
                </p>
              ) : loading ? (
                <p className="search-empty" aria-busy="true">
                  Loading products…
                </p>
              ) : hasQuery && results.length === 0 ? (
                <p className="search-empty">
                  No products match that search. Try a different word, or browse{" "}
                  <Link href="/products" onClick={close}>all products</Link>.
                </p>
              ) : (
                <div
                  className="search-grid"
                  onClick={(event) => {
                    /* Close when a product link is followed */
                    if ((event.target as HTMLElement).closest("a")) close();
                  }}
                >
                  {(hasQuery ? results : inspiration).map((product) => (
                    <ProductCard key={product.slug} product={product} compact />
                  ))}
                </div>
              )}
            </section>
          </div>

          {categories.length > 0 && (
            <div className="search-popular">
              <span className="search-popular-label">Search by category:</span>
              <ul>
                {categories.map((category) => (
                  <li key={category.slug}>
                    <button type="button" onClick={() => setQuery(category.name)}>
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
