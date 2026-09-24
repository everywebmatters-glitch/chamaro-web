"use client";

import { Droplets, Sun, SprayCan, Weight, Wrench } from "lucide-react";
import { useRef, useState } from "react";
import { chairCare, storePolicies, type Product } from "../lib/products";

const careIcons = {
  droplets: Droplets,
  spray: SprayCan,
  sun: Sun,
  wrench: Wrench,
  weight: Weight,
};

const tabs = [
  { id: "description", label: "Description" },
  { id: "additional", label: "Additional Information" },
  { id: "returns", label: "Return Policies" },
  { id: "warranty", label: "Warranty" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function ProductTabs({ product }: { product: Product }) {
  const [active, setActive] = useState<TabId>("description");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* Arrow-key navigation per the WAI-ARIA tabs pattern */
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + tabs.length) % tabs.length;
    setActive(tabs[next].id);
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
            onClick={() => setActive(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.label}
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
        {active === "description" && (
          <>
            <p className="tab-lede">{product.description}</p>

            <div className="tab-columns">
              <div>
                <h3>Features</h3>
                <ul className="tab-bullets">
                  {product.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <h3>Materials</h3>
                <ul className="tab-bullets">
                  {product.materials.map((material) => (
                    <li key={material}>{material}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3>Care</h3>
                <ul className="care-list">
                  {chairCare.map((item) => {
                    const Icon = careIcons[item.icon];
                    return (
                      <li key={item.text}>
                        <span className="care-icon">
                          <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                        </span>
                        {item.text}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </>
        )}

        {active === "additional" && (
          <dl className="spec-list spec-list-wide">
            {product.specs.map((spec) => (
              <div key={spec.label}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {active === "returns" && (
          <>
            <p className="tab-lede">{storePolicies.returns}</p>
            <p className="tab-lede">{storePolicies.delivery}</p>
          </>
        )}

        {active === "warranty" && <p className="tab-lede">{storePolicies.warranty}</p>}
      </div>
    </section>
  );
}
