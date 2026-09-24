"use client";

import { Minus, Plus } from "lucide-react";

export default function QuantityStepper({
  value,
  onChange,
  label = "Quantity",
  size = "default",
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  size?: "default" | "small";
}) {
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
        onClick={() => onChange(Math.min(99, value + 1))}
        disabled={value === 99}
        aria-label="Increase quantity"
      >
        <Plus size={size === "small" ? 14 : 16} />
      </button>
    </div>
  );
}
