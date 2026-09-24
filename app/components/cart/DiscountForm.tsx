"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { findDiscount } from "../../lib/cart";
import { useStore } from "../store/StoreProvider";

export default function DiscountForm({ idPrefix = "discount" }: { idPrefix?: string }) {
  const { discountCode, applyDiscount, removeDiscount } = useStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const applied = findDiscount(discountCode);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setError("Enter a discount code.");
      return;
    }
    if (applyDiscount(code)) {
      setCode("");
      setError("");
    } else {
      setError("This discount code isn't valid.");
    }
  };

  return (
    <div className="discount-form">
      <form onSubmit={submit} noValidate>
        <label className="sr-only" htmlFor={`${idPrefix}-code`}>
          Discount code
        </label>
        <input
          id={`${idPrefix}-code`}
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError("");
          }}
          placeholder="Discount code"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${idPrefix}-error` : undefined}
        />
        <button type="submit" disabled={!code.trim()}>
          Apply
        </button>
      </form>

      {error && (
        <p id={`${idPrefix}-error`} className="field-error">
          {error}
        </p>
      )}

      {applied && (
        <p className="discount-applied">
          <span>
            <strong>{applied.code}</strong> — {applied.label}
          </span>
          <button type="button" onClick={removeDiscount} aria-label={`Remove code ${applied.code}`}>
            <X size={14} />
          </button>
        </p>
      )}
    </div>
  );
}
