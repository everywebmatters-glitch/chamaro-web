"use client";

import { useEffect, useState } from "react";
import type { Product } from "../../lib/products";
import ProductCard from "../ProductCard";

/* =========================================================
   GRID LAYOUT SWITCHER + PRODUCT GRID
========================================================= */

type Layout = "list" | "2" | "3" | "4" | "5" | "6";

const layouts: { value: Layout; label: string; dots: number }[] = [
  { value: "list", label: "List view", dots: 0 },
  { value: "2", label: "2 columns", dots: 2 },
  { value: "3", label: "3 columns", dots: 3 },
  { value: "4", label: "4 columns", dots: 4 },
  { value: "5", label: "5 columns", dots: 5 },
  { value: "6", label: "6 columns", dots: 6 },
];

const STORAGE_KEY = "chamaro-catalog-layout";

function LayoutIcon({ dots }: { dots: number }) {
  if (dots === 0) {
    return (
      <svg viewBox="0 0 24 16" aria-hidden="true">
        <circle cx="3" cy="4" r="2" />
        <circle cx="3" cy="12" r="2" />
        <rect x="8" y="3" width="15" height="2" rx="1" />
        <rect x="8" y="11" width="15" height="2" rx="1" />
      </svg>
    );
  }

  const width = dots * 8;
  return (
    <svg viewBox={`0 0 ${width} 16`} style={{ width: `${width}px` }} aria-hidden="true">
      {Array.from({ length: dots }, (_, index) => (
        <g key={index}>
          <circle cx={4 + index * 8} cy="4" r="2.4" />
          <circle cx={4 + index * 8} cy="12" r="2.4" />
        </g>
      ))}
    </svg>
  );
}

export default function CatalogView({
  products,
  toolbarStart,
  toolbarEnd,
}: {
  products: Product[];
  toolbarStart: React.ReactNode;
  toolbarEnd: React.ReactNode;
}) {
  const [layout, setLayout] = useState<Layout>("4");

  /* Restore the viewer's last choice */
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Layout | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from localStorage
      if (saved && layouts.some((item) => item.value === saved)) setLayout(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const choose = (value: Layout) => {
    setLayout(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <>
      <div className="catalog-toolbar">
        <div className="catalog-toolbar-start">{toolbarStart}</div>

        <div className="layout-switcher" role="group" aria-label="Product layout">
          {layouts.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`layout-option layout-option-${item.value}${layout === item.value ? " selected" : ""}`}
              onClick={() => choose(item.value)}
              aria-label={item.label}
              aria-pressed={layout === item.value}
            >
              <LayoutIcon dots={item.dots} />
            </button>
          ))}
        </div>

        <div className="catalog-toolbar-end">{toolbarEnd}</div>
      </div>

      <div className="catalog-grid" data-cols={layout}>
        {products.map((product) => (
          <ProductCard
            key={product.slug}
            product={product}
            layout={layout === "list" ? "list" : "grid"}
          />
        ))}
      </div>
    </>
  );
}
