"use client";

import { useState } from "react";
import {
  INDIAN_STATES,
  PIN_CODE_PATTERN,
  SHIPPING_METHODS,
  shippingCost,
} from "../../lib/cart";
import { formatPrice } from "../../lib/products";

export default function ShippingEstimator({
  subtotal,
  idPrefix = "estimate",
}: {
  subtotal: number;
  idPrefix?: string;
}) {
  const [state, setState] = useState("");
  const [pin, setPin] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const pinValid = PIN_CODE_PATTERN.test(pin);
  const ready = submitted && state && pinValid;

  return (
    <form
      className="shipping-estimator"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
      noValidate
    >
      <label htmlFor={`${idPrefix}-state`}>State</label>
      <select
        id={`${idPrefix}-state`}
        value={state}
        onChange={(event) => setState(event.target.value)}
      >
        <option value="">Select a state</option>
        {INDIAN_STATES.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>

      <label htmlFor={`${idPrefix}-pin`}>PIN code</label>
      <input
        id={`${idPrefix}-pin`}
        inputMode="numeric"
        maxLength={6}
        value={pin}
        onChange={(event) => {
          setPin(event.target.value.replace(/\D/g, ""));
          setSubmitted(false);
        }}
        placeholder="e.g. 600001"
        aria-invalid={submitted && !pinValid ? true : undefined}
      />

      {submitted && (!state || !pinValid) && (
        <p className="field-error">Select a state and enter a valid 6-digit PIN code.</p>
      )}

      <button type="submit" className="outline-button">
        Calculate shipping
      </button>

      {ready && (
        <ul className="estimate-results" aria-live="polite">
          {SHIPPING_METHODS.map((method) => {
            const cost = shippingCost(method.id, subtotal);
            return (
              <li key={method.id}>
                <span>
                  {method.label}
                  <small>{method.eta}</small>
                </span>
                <strong>{cost === 0 ? "Free" : formatPrice(cost)}</strong>
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}
