"use client";

import Image from "next/image";
import Link from "next/link";
import { Banknote, CircleHelp, CreditCard, Lock, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
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
import { formatPrice } from "../../lib/products";
import DiscountForm from "../cart/DiscountForm";
import { useStore } from "../store/StoreProvider";
import { EMAIL_PATTERN, GSTIN_PATTERN, PHONE_PATTERN } from "../../lib/site";

/* =========================================================
   CHECKOUT
   TODO: connect a payment gateway (e.g. Razorpay) and an
   orders API. Until then the form validates but does not
   place orders or take payment.
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

type PaymentMethod = "upi" | "card" | "cod";

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

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: "upi", label: "UPI (GPay, PhonePe, Paytm)", icon: Smartphone },
  { id: "card", label: "Credit / debit card", icon: CreditCard },
  { id: "cod", label: "Cash on delivery", icon: Banknote },
];

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
  const { cart, hydrated, discountCode, orderNote } = useStore();
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [shipping, setShipping] = useState<ShippingMethodId>("standard");
  const [payment, setPayment] = useState<PaymentMethod>("upi");
  const [notice, setNotice] = useState("");

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

  const lines = resolveLines(cart);
  const subtotal = cartSubtotal(lines);
  const discount = discountAmount(subtotal, findDiscount(discountCode));
  const errors = validate(form);
  const addressReady =
    form.address.trim() && form.city.trim() && form.state && PIN_CODE_PATTERN.test(form.pin);
  const shippingPrice = addressReady ? shippingCost(shipping, subtotal) : undefined;
  const total = subtotal - discount + (shippingPrice ?? 0);
  const itemCount = lines.reduce((count, line) => count + line.quantity, 0);

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setNotice("");
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

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
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

    /* TODO: create the order and hand off to the payment gateway here */
    void orderNote;
    setNotice(
      "Your details look good. Online payment isn't connected yet, so this order hasn't been placed — please contact us to complete your purchase."
    );
  };

  if (!hydrated) {
    return <div className="cart-page-loading" aria-busy="true" />;
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
            {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
              <label key={id} className={payment === id ? "selected" : ""}>
                <input
                  type="radio"
                  name="payment"
                  value={id}
                  checked={payment === id}
                  onChange={() => setPayment(id)}
                />
                <span>{label}</span>
                <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
              </label>
            ))}
          </div>
        </section>

        <button type="submit" className="add-to-cart checkout-submit">
          {payment === "cod" ? "Place order" : `Pay now – ${formatPrice(total)}`}
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

          <DiscountForm idPrefix="checkout-discount" />

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
  );
}
