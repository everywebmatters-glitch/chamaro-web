"use client";

import { Check, Copy } from "lucide-react";
import { useRef, useState } from "react";
import { storePolicies, type Product } from "../lib/products";
import ProductReviewsPanel from "./ProductReviews";
import { useVariantSelection } from "./ProductVariantProvider";

/* One row of tabs: the five Admin edits for every product, then customer reviews */
const tabs = [
  { id: "description", label: "Description" },
  { id: "features", label: "Features" },
  { id: "additional", label: "Additional Information" },
  { id: "warranty", label: "Warranty" },
  { id: "disclaimer", label: "Disclaimer" },
  { id: "reviews", label: "Reviews" },
] as const;

type TabId = (typeof tabs)[number]["id"];

/* Plain text from Admin: each non-empty line becomes a paragraph */
function Paragraphs({ text }: { text: string }) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => (
      <p key={index} className="tab-lede">
        {line}
      </p>
    ));
}

export default function ProductTabs({ product }: { product: Product }) {
  const [active, setActive] = useState<TabId>("description");
  const [copied, setCopied] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /* The SKU row follows the chosen colour */
  const { variant } = useVariantSelection();
  const specs = variant?.sku
    ? [{ label: "SKU", value: variant.sku }, ...product.specs.filter((spec) => spec.label !== "SKU")]
    : product.specs;

  const copySpecs = async () => {
    const text = specs.map((spec) => `${spec.label}: ${spec.value}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  /* On narrow screens the single row scrolls sideways; keep the chosen tab in view */
  const select = (index: number) => {
    setActive(tabs[index].id);
    tabRefs.current[index]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  };

  /* Arrow-key navigation per the WAI-ARIA tabs pattern */
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + tabs.length) % tabs.length;
    select(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className="product-tabs" aria-label="Product information">
      <div className="product-tabs-list" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={active === tab.id}
            tabIndex={active === tab.id ? 0 : -1}
            className={active === tab.id ? "selected" : ""}
            onClick={() => select(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.label}
            {tab.id === "reviews" && product.reviewCount > 0 ? ` (${product.reviewCount})` : ""}
          </button>
        ))}
      </div>

      <div
        className="product-tabs-panel"
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        tabIndex={0}
      >
        {active === "description" &&
          (product.description ? <Paragraphs text={product.description} /> : <p className="tab-lede">No description for this product yet.</p>)}

        {active === "features" &&
          (product.features.length > 0 ? (
            <ul className="tab-bullets">
              {product.features.map((feature, index) => (
                <li key={`${index}-${feature}`}>{feature}</li>
              ))}
            </ul>
          ) : (
            <p className="tab-lede">No features listed for this product yet.</p>
          ))}

        {active === "additional" &&
          (specs.length > 0 ? (
            <div className="spec-table spec-list-wide">
              <div className="spec-table-header">
                <span>Specification</span>
                <span>Details</span>
                <button
                  type="button"
                  className="spec-copy-btn"
                  onClick={copySpecs}
                  aria-label="Copy specifications"
                  title="Copy specifications"
                >
                  {copied ? (
                    <Check size={18} strokeWidth={1.8} aria-hidden="true" />
                  ) : (
                    <Copy size={18} strokeWidth={1.6} aria-hidden="true" />
                  )}
                </button>
              </div>
              <dl className="spec-list">
                {specs.map((spec, index) => (
                  <div key={`${index}-${spec.label}`}>
                    <dt>{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="tab-lede">No additional information for this product yet.</p>
          ))}

        {/* Admin text for this product when set, otherwise the store-wide text */}
        {active === "warranty" &&
          (product.warranty ? <Paragraphs text={product.warranty} /> : <p className="tab-lede">{storePolicies.warranty}</p>)}

        {active === "reviews" && <ProductReviewsPanel slug={product.slug} />}

        {active === "disclaimer" &&
          (product.disclaimer ? (
            <Paragraphs text={product.disclaimer} />
          ) : (
            <p className="tab-lede">{storePolicies.disclaimer}</p>
          ))}
      </div>
    </section>
  );
}
