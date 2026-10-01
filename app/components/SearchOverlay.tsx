"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, LayoutGrid, Search } from "lucide-react";
import { useState } from "react";
import {
  products,
  searchProducts,
  sortProducts,
} from "../lib/products";
import Modal from "./Modal";
import ProductCard from "./ProductCard";

const inspiration = sortProducts(products, "best-selling").slice(0, 4);

/* Mirrors the category nav strip on the homepage (ChairShowcase) */
const quickLinks = [
  { name: "All Products", href: "/products", icon: null },
  { name: "Boss Chairs", href: "/products?category=boss", icon: "/icons/boss-chair.svg" },
  { name: "Executive Chairs", href: "/products?category=executive", icon: "/icons/executive-chair.svg" },
  { name: "Workstation Chairs", href: "/products?category=workstation", icon: "/icons/workstation.svg" },
  { name: "Visitor Chairs", href: "/products?category=visitor", icon: "/icons/visitor-chair.svg" },
  { name: "Cafe Chairs", href: "/products?category=cafe", icon: "/icons/cafe-chair.svg" },
  { name: "Bar Stools", href: "/products?category=bar-stool", icon: "/icons/bar-stool.svg" },
];

/* `query` differs from `label` where the label isn't a contiguous
   substring of any product name (e.g. "Metro Mesh Visitor Chair") */
const popularSearches = [
  { label: "Executive Chair", query: "Executive Chair" },
  { label: "Boss Chair", query: "Boss Chair" },
  { label: "Mesh Chair", query: "Mesh" },
  { label: "Cafe Chair", query: "Cafe Chair" },
  { label: "Visitor Chair", query: "Visitor Chair" },
  { label: "Bar Stool", query: "Bar Stool" },
  { label: "Workstation Chair", query: "Workstation Chair" },
];

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
              <h3 id="quick-link-title">Quick Links</h3>
              <ul>
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} onClick={close}>
                      <span className="search-quick-link-icon">
                        {link.icon ? (
                          <Image src={link.icon} alt="" width={20} height={20} />
                        ) : (
                          <LayoutGrid size={18} strokeWidth={1.8} aria-hidden="true" />
                        )}
                      </span>
                      <span className="search-quick-link-name">{link.name}</span>
                      <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
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

          <div className="search-popular">
            <span className="search-popular-label">Popular searches:</span>
            <ul>
              {popularSearches.map((term) => (
                <li key={term.label}>
                  <button type="button" onClick={() => setQuery(term.query)}>
                    {term.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Modal>
  );
}
