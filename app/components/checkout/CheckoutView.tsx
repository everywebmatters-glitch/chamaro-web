"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleCheck, CircleHelp, CreditCard, Lock, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../lib/api";
import {
  cartSubtotal,
  discountAmount,
  findDiscount,
  INDIAN_STATES,
  PIN_CODE_PATTERN,
  resolveLines,
  SHIPPING_METHODS,
  shippingCost,
  variantLabel,
  type ShippingMethodId,
} from "../../lib/cart";
import {
  createAddress,
  listAddresses,
  openPayment,
  placeOrder,
  replaceServerCart,
  sendCheckoutCode,
  verifyCheckoutCode,
  verifyPayment,
  type PaymentSession,
} from "../../lib/checkout-api";
import {
  checkoutErrorMessage,
  checkoutFingerprint,
  findSameAddress,
  paymentOutcomeMessage,
  toAddressInput,
  toServerCartItems,
} from "../../lib/checkout-flow";
import { formatPrice } from "../../lib/products";
import { payWithRazorpay } from "../../lib/razorpay";
import { useAuth } from "../auth/AuthProvider";
import DiscountForm from "../cart/DiscountForm";
import Modal from "../Modal";
import { useStore } from "../store/StoreProvider";
import { EMAIL_PATTERN, GSTIN_PATTERN, PHONE_PATTERN } from "../../lib/site";

/* =========================================================
   CHECKOUT
   Signed-in customers pay online with Razorpay:
   1. the browser cart is sent to the server cart, the address
      is saved, and the order is placed (Idempotency-Key, so a
      retry never places a second order);
   2. the server opens payment for the order's own total, after
      the emailed checkout code when it asks for one;
   3. Razorpay Checkout takes the payment, and its callback is
      forwarded to the server, which reads the payment back from
      Razorpay before confirming the order.
   No cash on delivery. Prices and totals shown here are a
   preview; the amount charged is the server's order total.
========================================================= */

type Form = {
  contact: string;
  marketing: boolean;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  pin: string;
  phone: string;
  needGst: boolean;
  company: string;
  gstin: string;
  saveInfo: boolean;
};

/* The order this checkout attempt placed, so pressing Pay again (after closing the payment form, a failed payment
   or a network error) pays that order instead of placing another. Cleared once paid or no longer payable. */
type PlacedAttempt = { userId: string; fingerprint: string; idempotencyKey: string; orderId?: string; total?: string };
const ATTEMPT_KEY = "chamaro-checkout-attempt";

function readAttempt(): PlacedAttempt | null {
  try {
    const raw = window.sessionStorage.getItem(ATTEMPT_KEY);
    return raw ? (JSON.parse(raw) as PlacedAttempt) : null;
  } catch {
    return null;
  }
}

function writeAttempt(attempt: PlacedAttempt | null) {
  try {
    if (attempt) window.sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
    else window.sessionStorage.removeItem(ATTEMPT_KEY);
  } catch {
    /* storage unavailable: a retry may place a new order, which the unpaid-order expiry cleans up */
  }
}

function newIdempotencyKey() {
  return `chk_${crypto.randomUUID()}`;
}

type Phase = "idle" | "working" | "code" | "paying" | "done";

const EMPTY: Form = {
  contact: "",
  marketing: false,
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  pin: "",
  phone: "",
  needGst: false,
  company: "",
  gstin: "",
  saveInfo: false,
};

const SAVED_KEY = "chamaro-checkout-info";


function validate(form: Form) {
  const errors: Partial<Record<keyof Form, string>> = {};
  const contact = form.contact.trim();
  if (!contact) errors.contact = "Enter an email or mobile number.";
  else if (!EMAIL_PATTERN.test(contact) && !PHONE_PATTERN.test(contact.replace(/\s/g, "")))
    errors.contact = "Enter a valid email or 10-digit mobile number.";
  if (!form.lastName.trim()) errors.lastName = "Enter a last name.";
  if (!form.address.trim()) errors.address = "Enter an address.";
  if (!form.city.trim()) errors.city = "Enter a city.";
  if (!form.state) errors.state = "Select a state.";
  if (!PIN_CODE_PATTERN.test(form.pin)) errors.pin = "Enter a valid 6-digit PIN code.";
  if (!PHONE_PATTERN.test(form.phone.replace(/\s/g, "")))
    errors.phone = "Enter a 10-digit mobile number for delivery updates.";
  if (form.needGst) {
    if (!form.company.trim()) errors.company = "Enter the registered business name.";
    if (!GSTIN_PATTERN.test(form.gstin.trim().toUpperCase())) errors.gstin = "Enter a valid 15-character GSTIN.";
  }
  return errors;
}

function Field({
  id,
  label,
  error,
  className = "",
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`field ${className}${error ? " has-error" : ""}`}>
      {children}
      <label htmlFor={id}>{label}</label>
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function CheckoutView() {
  const { catalog, catalogFailed, findProduct, cart, hydrated, discountCode, orderNote, clearCart } =
    useStore();
  const { status: authStatus, user, token } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [shipping, setShipping] = useState<ShippingMethodId>("standard");
  const [notice, setNotice] = useState("");
  const [authGateDismissed, setAuthGateDismissed] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [orderTotal, setOrderTotal] = useState<string | null>(null);
  const [done, setDone] = useState<{ orderId: string; message: string } | null>(null);
  /* Guards against a double click starting two payment flows */
  const busy = useRef(false);

  /* Restore saved delivery details */
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SAVED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from localStorage
      if (saved) setForm({ ...EMPTY, ...JSON.parse(saved), saveInfo: true });
    } catch {
      /* storage unavailable */
    }
  }, []);

  const lines = resolveLines(cart, findProduct);
  const subtotal = cartSubtotal(lines);
  const discount = discountAmount(subtotal, findDiscount(discountCode));
  const errors = validate(form);
  const addressReady =
    form.address.trim() && form.city.trim() && form.state && PIN_CODE_PATTERN.test(form.pin);
  const shippingPrice = addressReady ? shippingCost(shipping, subtotal) : undefined;
  const total = subtotal - discount + (shippingPrice ?? 0);
  const itemCount = lines.reduce((count, line) => count + line.quantity, 0);
  const showAuthGate = authStatus === "unauthenticated" && !authGateDismissed;
  const working = phase === "working" || phase === "paying";

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setNotice("");
  };

  /* The order note, plus the GST invoice details (the API has no separate fields for them yet) */
  const noteForOrder = () => {
    const gst = form.needGst ? `GST invoice: ${form.company.trim()}, GSTIN ${form.gstin.trim().toUpperCase()}` : "";
    return [orderNote.trim(), gst].filter(Boolean).join("\n").slice(0, 500);
  };

  const fail = (error: unknown) => {
    const code = error instanceof ApiError ? error.code : "UNKNOWN";
    /* The order can't be paid any more: the next Pay places a fresh one */
    if (code === "ORDER_PAYMENT_EXPIRED" || code === "ORDER_NOT_PAYABLE") writeAttempt(null);
    setNotice(checkoutErrorMessage(code));
    setPhase("idle");
  };

  /* Steps 2 and 3: open payment for the placed order (asking for the emailed code if the server wants it), take it with
     Razorpay, and let the server confirm it. */
  const pay = async (orderId: string) => {
    if (!token) return;
    let session: PaymentSession;
    try {
      session = await openPayment(token, orderId);
    } catch (error) {
      if (error instanceof ApiError && error.code === "CHECKOUT_NOT_VERIFIED") {
        await sendCheckoutCode(token).catch((sendError) => {
          /* A code sent a moment ago is still valid: just ask for it */
          if (!(sendError instanceof ApiError && sendError.code === "OTP_RESEND_COOLDOWN")) throw sendError;
        });
        setCode("");
        setCodeError("");
        setPhase("code");
        return;
      }
      throw error;
    }

    setPhase("paying");
    const result = await payWithRazorpay(session, { name: user?.name, email: user?.email, contact: form.phone.replace(/\s/g, "") });
    if (result.kind === "closed") {
      setNotice(
        result.lastFailure
          ? "The payment didn't go through and you have not been charged. Press Pay now to try again."
          : `Payment wasn't completed. Your order ${orderId} is saved for an hour; press Pay now to finish paying.`
      );
      setPhase("idle");
      return;
    }

    setPhase("working");
    /* Razorpay has taken the payment. If the server can't be reached to confirm it now, the payment worker and the
       webhook still will: never tell the shopper they weren't charged, and don't invite a second payment. */
    let outcome: { done: boolean; message: string };
    try {
      outcome = paymentOutcomeMessage((await verifyPayment(token, orderId, result.callback)).outcome);
    } catch {
      outcome = paymentOutcomeMessage("pending");
    }
    if (!outcome.done) {
      setNotice(outcome.message);
      setPhase("idle");
      return;
    }
    writeAttempt(null);
    clearCart();
    setDone({ orderId, message: outcome.message });
    setPhase("done");
  };

  const errorFor = (key: keyof Form) => (touched ? errors[key] : undefined);

  const inputProps = (key: keyof Form) => ({
    id: `checkout-${key}`,
    name: key,
    value: form[key] as string,
    placeholder: " ",
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => update(key, event.target.value as never),
    "aria-invalid": errorFor(key) ? true : undefined,
    "aria-describedby": errorFor(key) ? `checkout-${key}-error` : undefined,
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current) return;
    setTouched(true);

    if (Object.keys(errors).length > 0) {
      setNotice("");
      /* Move focus to the first invalid field */
      const first = Object.keys(errors)[0];
      document.getElementById(`checkout-${first}`)?.focus();
      return;
    }

    try {
      if (form.saveInfo) {
        const { contact, firstName, lastName, address, apartment, city, state, pin, phone } = form;
        window.localStorage.setItem(
          SAVED_KEY,
          JSON.stringify({ contact, firstName, lastName, address, apartment, city, state, pin, phone })
        );
      } else {
        window.localStorage.removeItem(SAVED_KEY);
      }
    } catch {
      /* storage unavailable */
    }

    if (authStatus !== "authenticated" || !token || !user) {
      setNotice("Please log in or create an account to pay for your order.");
      setAuthGateDismissed(false);
      return;
    }

    const { items, unavailable } = toServerCartItems(lines);
    if (unavailable.length > 0) {
      setNotice(`${unavailable.join(", ")} ${unavailable.length === 1 ? "is" : "are"} no longer available as chosen. Please review your cart.`);
      return;
    }

    busy.current = true;
    setPhase("working");
    setNotice("");
    try {
      /* Step 1: place the order, unless this exact checkout already did */
      const address = toAddressInput(form);
      const note = noteForOrder();
      const fingerprint = checkoutFingerprint(items, address, shipping, note);
      const saved = readAttempt();
      let attempt: PlacedAttempt =
        saved && saved.userId === user.id && saved.fingerprint === fingerprint
          ? saved
          : { userId: user.id, fingerprint, idempotencyKey: newIdempotencyKey() };
      writeAttempt(attempt);

      if (!attempt.orderId) {
        await replaceServerCart(token, items);
        const addressId = findSameAddress(await listAddresses(token), address)?.id ?? (await createAddress(token, address)).id;
        const order = await placeOrder(token, attempt.idempotencyKey, { addressId, shippingMethod: shipping, ...(note ? { note } : {}) });
        attempt = { ...attempt, orderId: order.id, total: order.total };
        writeAttempt(attempt);
      }
      setOrderTotal(attempt.total ?? null);
      await pay(attempt.orderId!);
    } catch (error) {
      fail(error);
    } finally {
      busy.current = false;
    }
  };

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const attempt = readAttempt();
    if (!token || !attempt?.orderId || busy.current) return;
    if (!/^\d{6}$/.test(code)) {
      setCodeError("Enter the 6-digit code from the email.");
      return;
    }
    busy.current = true;
    setCodeError("");
    try {
      await verifyCheckoutCode(token, code);
    } catch (error) {
      setCodeError(checkoutErrorMessage(error instanceof ApiError ? error.code : "UNKNOWN"));
      busy.current = false;
      return;
    }
    setPhase("working");
    try {
      await pay(attempt.orderId);
    } catch (error) {
      fail(error);
    } finally {
      busy.current = false;
    }
  };

  const resendCode = async () => {
    if (!token) return;
    try {
      await sendCheckoutCode(token);
      setCodeError("We've sent a new code.");
    } catch (error) {
      setCodeError(checkoutErrorMessage(error instanceof ApiError ? error.code : "UNKNOWN"));
    }
  };

  if (phase === "done" && done) {
    return (
      <div className="cart-empty cart-empty-page checkout-done" role="status">
        <CircleCheck size={40} strokeWidth={1.6} aria-hidden="true" />
        <h1>Thank you for your order</h1>
        <p>{done.message}</p>
        <p className="checkout-done-ref">
          Order reference: <strong>{done.orderId}</strong>
        </p>
        <div className="auth-gate-actions">
          <Link href="/account" className="add-to-cart">
            View your account
          </Link>
          <Link href="/products" className="outline-button">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!hydrated || (cart.length > 0 && !catalog && !catalogFailed)) {
    return <div className="cart-page-loading" aria-busy="true" />;
  }

  if (cart.length > 0 && !catalog) {
    return (
      <div className="cart-empty cart-empty-page" role="alert">
        <h1>We couldn&apos;t load your cart</h1>
        <p>Please check your connection and try again in a moment.</p>
        <button type="button" className="add-to-cart" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="cart-empty cart-empty-page">
        <h1>Your cart is empty</h1>
        <p>Add a chair to your cart before checking out.</p>
        <Link href="/products" className="add-to-cart">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <Modal
        open={showAuthGate}
        onClose={() => setAuthGateDismissed(true)}
        title="Sign in to check out"
        className="auth-gate-modal info-modal"
      >
        <h2>Sign in to check out</h2>
        <p>Log in or create an account to pay for your order and track it.</p>

        <div className="auth-gate-actions">
          <Link href="/account/login?redirect=/checkout" className="add-to-cart">
            Log in
          </Link>
          <Link href="/account/register?redirect=/checkout" className="outline-button">
            Create account
          </Link>
        </div>

        <button type="button" className="auth-link-button" onClick={() => setAuthGateDismissed(true)}>
          Not now
        </button>
      </Modal>

      <Modal
        open={phase === "code"}
        onClose={() => setPhase("idle")}
        title="Confirm it's you"
        className="auth-gate-modal info-modal"
      >
        <h2>Confirm it&apos;s you</h2>
        <p>
          We&apos;ve emailed a 6-digit code to <strong>{user?.email}</strong>. Enter it to continue to payment
          {orderTotal ? (
            <>
              {" "}of <strong>{formatPrice(Number(orderTotal))}</strong>
            </>
          ) : null}
          .
        </p>
        {discount > 0 && (
          <p className="checkout-subtext">Coupon codes can&apos;t be used for online payment yet, so the amount above has no discount.</p>
        )}
        <form onSubmit={submitCode} noValidate>
          <div className={`field${codeError ? " has-error" : ""}`}>
            <input
              id="checkout-code"
              value={code}
              placeholder=" "
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              aria-invalid={codeError ? true : undefined}
              aria-describedby={codeError ? "checkout-code-error" : undefined}
              autoFocus
            />
            <label htmlFor="checkout-code">Verification code</label>
            {codeError && (
              <p className="field-error" id="checkout-code-error" role="alert">
                {codeError}
              </p>
            )}
          </div>
          <div className="auth-gate-actions">
            <button type="submit" className="add-to-cart">
              Continue to payment
            </button>
            <button type="button" className="outline-button" onClick={resendCode}>
              Send a new code
            </button>
          </div>
        </form>
      </Modal>

      <div className="checkout-layout">
      {/* ================= FORM ================= */}

      <form className="checkout-form" onSubmit={submit} noValidate>
        <h1 className="sr-only">Checkout</h1>

        {/* Contact */}

        <section aria-labelledby="contact-title">
          <div className="checkout-section-header">
            <h2 id="contact-title">Contact</h2>
          </div>

          <Field id="checkout-contact" label="Email or mobile phone number" error={errorFor("contact")}>
            <input {...inputProps("contact")} autoComplete="email" />
            <span
              className="field-help"
              title="We'll send your order confirmation and delivery updates here."
            >
              <CircleHelp size={18} aria-hidden="true" />
            </span>
          </Field>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.marketing}
              onChange={(event) => update("marketing", event.target.checked)}
            />
            <span>Email me with news and offers</span>
          </label>
        </section>

        {/* Delivery */}

        <section aria-labelledby="delivery-title">
          <h2 id="delivery-title">Delivery</h2>

          <div className="field field-select">
            <select id="checkout-country" value="India" disabled>
              <option>India</option>
            </select>
            <label htmlFor="checkout-country">Country/Region</label>
          </div>

          <div className="field-row">
            <Field id="checkout-firstName" label="First name (optional)">
              <input {...inputProps("firstName")} autoComplete="given-name" />
            </Field>
            <Field id="checkout-lastName" label="Last name" error={errorFor("lastName")}>
              <input {...inputProps("lastName")} autoComplete="family-name" />
            </Field>
          </div>

          <Field id="checkout-address" label="Address" error={errorFor("address")}>
            <input {...inputProps("address")} autoComplete="address-line1" />
          </Field>

          <Field id="checkout-apartment" label="Apartment, suite, floor, etc. (optional)">
            <input {...inputProps("apartment")} autoComplete="address-line2" />
          </Field>

          <div className="field-row field-row-3">
            <Field id="checkout-city" label="City" error={errorFor("city")}>
              <input {...inputProps("city")} autoComplete="address-level2" />
            </Field>

            <Field id="checkout-state" label="State" error={errorFor("state")} className="field-select">
              <select
                id="checkout-state"
                value={form.state}
                onChange={(event) => update("state", event.target.value)}
                autoComplete="address-level1"
                aria-invalid={errorFor("state") ? true : undefined}
                data-empty={form.state ? "false" : "true"}
              >
                <option value="" disabled hidden />
                {INDIAN_STATES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>

            <Field id="checkout-pin" label="PIN code" error={errorFor("pin")}>
              <input
                {...inputProps("pin")}
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                onChange={(event) => update("pin", event.target.value.replace(/\D/g, ""))}
              />
            </Field>
          </div>

          <Field id="checkout-phone" label="Phone (for delivery updates)" error={errorFor("phone")}>
            <input {...inputProps("phone")} type="tel" autoComplete="tel" />
          </Field>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.needGst}
              onChange={(event) => update("needGst", event.target.checked)}
            />
            <span>I need a GST invoice for my business</span>
          </label>

          {form.needGst && (
            <div className="field-row">
              <Field id="checkout-company" label="Registered business name" error={errorFor("company")}>
                <input {...inputProps("company")} autoComplete="organization" />
              </Field>
              <Field id="checkout-gstin" label="GSTIN" error={errorFor("gstin")}>
                <input
                  {...inputProps("gstin")}
                  maxLength={15}
                  onChange={(event) => update("gstin", event.target.value.toUpperCase())}
                />
              </Field>
            </div>
          )}

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.saveInfo}
              onChange={(event) => update("saveInfo", event.target.checked)}
            />
            <span>Save this information for next time</span>
          </label>
        </section>

        {/* Shipping method */}

        <section aria-labelledby="shipping-title">
          <h3 id="shipping-title">Shipping method</h3>

          {addressReady ? (
            <div className="option-list">
              {SHIPPING_METHODS.map((method) => {
                const cost = shippingCost(method.id, subtotal);
                return (
                  <label key={method.id} className={shipping === method.id ? "selected" : ""}>
                    <input
                      type="radio"
                      name="shipping"
                      value={method.id}
                      checked={shipping === method.id}
                      onChange={() => setShipping(method.id)}
                    />
                    <span>
                      {method.label}
                      <small>{method.eta}</small>
                    </span>
                    <strong>{cost === 0 ? "FREE" : formatPrice(cost)}</strong>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="checkout-placeholder">
              Enter your shipping address to view available shipping methods.
            </p>
          )}
        </section>

        {/* Payment */}

        <section aria-labelledby="payment-title">
          <h2 id="payment-title">Payment</h2>
          <p className="checkout-subtext">
            <Lock size={14} aria-hidden="true" /> All transactions are secure and encrypted.
          </p>

          <div className="option-list">
            <label className="selected">
              <input type="radio" name="payment" value="razorpay" checked readOnly />
              <span>
                Pay online with Razorpay
                <small>UPI, credit/debit cards, net banking and wallets</small>
              </span>
              <span aria-hidden="true">
                <Smartphone size={20} strokeWidth={1.6} /> <CreditCard size={20} strokeWidth={1.6} />
              </span>
            </label>
          </div>
        </section>

        <button type="submit" className="add-to-cart checkout-submit" disabled={working} aria-busy={working}>
          {phase === "paying" ? "Waiting for payment…" : working ? "Please wait…" : `Pay now – ${formatPrice(total)}`}
        </button>

        {touched && Object.keys(errors).length > 0 && (
          <p className="field-error" role="alert">
            Please fix the highlighted fields.
          </p>
        )}

        {notice && (
          <p className="checkout-notice" role="alert">
            {notice}
          </p>
        )}

        <nav className="checkout-footer-links" aria-label="Policies">
          <Link href="/cart">Return to cart</Link>
          <Link href="#">Refund policy</Link>
          <Link href="#">Privacy policy</Link>
          <Link href="#">Terms of service</Link>
        </nav>
      </form>

      {/* ================= SUMMARY ================= */}

      <aside className="checkout-summary" aria-label="Order summary">
        <div className="checkout-summary-inner">
          <ul className="checkout-lines">
            {lines.map((line) => (
              <li key={line.key}>
                <span className="checkout-thumb">
                  <Image src={line.product.images[0].src} alt="" fill sizes="64px" />
                  <span className="checkout-qty" aria-label={`Quantity ${line.quantity}`}>
                    {line.quantity}
                  </span>
                </span>
                <span className="checkout-line-name">
                  {line.product.name}
                  <small>{variantLabel(line)}</small>
                </span>
                <span>{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="cart-coupon checkout-coupon">
            <h3>Have a coupon?</h3>
            <p>Add your code for an instant discount</p>
            <DiscountForm idPrefix="checkout-discount" />
          </div>

          <dl className="checkout-totals">
            <div>
              <dt>Subtotal · {itemCount} {itemCount === 1 ? "item" : "items"}</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div>
                <dt>Discount</dt>
                <dd>−{formatPrice(discount)}</dd>
              </div>
            )}
            <div>
              <dt>Shipping</dt>
              <dd className={shippingPrice === undefined ? "muted" : ""}>
                {shippingPrice === undefined
                  ? "Enter shipping address"
                  : shippingPrice === 0
                    ? "FREE"
                    : formatPrice(shippingPrice)}
              </dd>
            </div>
            <div className="checkout-total">
              <dt>Total</dt>
              <dd>
                <small>INR</small> {formatPrice(total)}
              </dd>
            </div>
          </dl>
          <p className="cart-tax-note">Including GST.</p>
        </div>
      </aside>
      </div>
    </>
  );
}
