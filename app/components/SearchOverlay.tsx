"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useState } from "react";
import {
  categories,
  products,
  searchProducts,
  sortProducts,
} from "../lib/products";
import Modal from "./Modal";
import ProductCard from "./ProductCard";

const inspiration = sortProducts(products, "best-selling").slice(0, 4);

export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const results = searchProducts(query);
  const hasQuery = query.trim().length > 0;

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
              placeholder="Search chairs, e.g. executive, cafe…"
              autoComplete="off"
              autoFocus
            />
          </form>

          <div className="search-layout">
            <nav
              className="search-quick-links"
              aria-labelledby="quick-link-title"
            >
              <h3 id="quick-link-title">Quick link</h3>
              <ul>
                <li>
                  <Link href="/products" onClick={close}>
                    All Products
                  </Link>
                </li>
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/products?category=${category.slug}`}
                      onClick={close}
                    >
                      {category.name} Chairs
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <section className="search-results" aria-live="polite">
              <h3>
                {hasQuery
                  ? `${results.length} ${results.length === 1 ? "result" : "results"} for “${query.trim()}”`
                  : "Need some inspiration?"}
              </h3>

              {hasQuery && results.length === 0 ? (
                <p className="search-empty">
                  No chairs match that search. Try “boss”, “cafe” or
                  “executive”.
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
        </>
      )}
    </Modal>
  );
}
