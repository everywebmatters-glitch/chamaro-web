"use client";

import { Minus, Plus } from "lucide-react";

export default function QuantityStepper({
  value,
  onChange,
  label = "Quantity",
  size = "default",
  max = 99,
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  size?: "default" | "small";
  /* Highest quantity the shopper may pick (e.g. units in stock); never above 99 */
  max?: number;
}) {
  const limit = Math.max(1, Math.min(99, max));
  return (
    <div
      className={`quantity-stepper${size === "small" ? " quantity-stepper-small" : ""}`}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value === 1}
        aria-label="Decrease quantity"
      >
        <Minus size={size === "small" ? 14 : 16} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        onClick={() => onChange(Math.min(limit, value + 1))}
        disabled={value >= limit}
        aria-label="Increase quantity"
      >
        <Plus size={size === "small" ? 14 : 16} />
      </button>
    </div>
  );
}
