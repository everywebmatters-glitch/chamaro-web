"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { findDiscount, resolveLines } from "../../lib/cart";
import { validateCoupon } from "../../lib/coupon-api";
import { useAuth } from "../auth/AuthProvider";
import { useStore } from "../store/StoreProvider";

export default function DiscountForm({ idPrefix = "discount" }: { idPrefix?: string }) {
  const { cart, findProduct, discountCode, discountCustomerId, applyDiscount, removeDiscount } = useStore();
  const { status, user, token } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [signInRequired, setSignInRequired] = useState(false);
  const [applying, setApplying] = useState(false);
  const applied = discountCustomerId === user?.id ? findDiscount(discountCode) : undefined;

  useEffect(() => {
    if (status !== "loading" && discountCode && discountCustomerId !== user?.id) removeDiscount();
  }, [status, discountCode, discountCustomerId, user?.id, removeDiscount]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setError("Enter a discount code.");
      return;
    }
    if (!user || !token) {
      setSignInRequired(true);
      setError("Sign in to apply a one-time coupon to your account.");
      return;
    }

    setApplying(true);
    setError("");
    setSignInRequired(false);
    try {
      const lines = resolveLines(cart, findProduct);
      if (lines.length === 0 || lines.some((line) => !line.product.apiId)) {
        setError("We couldn't verify the products in your cart. Please try again.");
        return;
      }
      const items = lines.flatMap((line) => {
        if (!line.product.apiId) return [];
        return [{
          productId: line.product.apiId,
          ...(line.variant ? { variantId: line.variant.id } : {}),
          quantity: line.quantity,
        }];
      });
      const result = await validateCoupon(token, {
        code: code.trim().toUpperCase(),
        items,
      });
      if (applyDiscount(result.code, user.id, result.discountTotal)) setCode("");
      else setError("This discount code isn't valid.");
    } catch (cause) {
      if (cause instanceof ApiError) {
        switch (cause.code) {
          case "COUPON_INVALID":
            setError("This discount code isn't valid.");
            break;
          case "COUPON_NOT_APPLICABLE":
            setError("This coupon doesn't apply to the chairs in your cart.");
            break;
          case "COUPON_ALREADY_USED":
            setError("This coupon has already been used on your account.");
            break;
          default:
            setError(cause.status === 0
              ? "We couldn't verify this coupon. Check your connection and try again."
              : "We couldn't apply this coupon right now. Please try again.");
        }
      } else {
        setError("We couldn't apply this coupon right now. Please try again.");
      }
    } finally {
      setApplying(false);
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
            setSignInRequired(false);
          }}
          placeholder="Discount code"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${idPrefix}-error` : undefined}
        />
        <button type="submit" disabled={!code.trim() || applying || status === "loading"}>
          {applying ? "Checking…" : "Apply"}
        </button>
      </form>

      {error && (
        <p id={`${idPrefix}-error`} className="field-error">
          {error}
          {signInRequired && (
            <>
              {" "}
              <Link href="/account/login?redirect=%2Fcheckout">Sign in</Link>
            </>
          )}
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
