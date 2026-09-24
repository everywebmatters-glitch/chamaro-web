"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "../store/StoreProvider";
import AuthField, { AUTH_NOT_CONNECTED, EMAIL_PATTERN, MIN_PASSWORD } from "./AuthField";

/* Written by checkout when the shopper ticks "Save this information" */
const SAVED_ADDRESS_KEY = "chamaro-checkout-info";

type SavedAddress = {
  firstName?: string;
  lastName?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  pin?: string;
  phone?: string;
  contact?: string;
};

const sections = [
  { id: "dashboard", label: "Dashboard" },
  { id: "orders", label: "Orders" },
  { id: "addresses", label: "Addresses" },
  { id: "details", label: "Account Details" },
] as const;

type SectionId = (typeof sections)[number]["id"];

function Dashboard({ go }: { go: (id: SectionId) => void }) {
  return (
    <div className="account-content">
      <h2>Hello, guest</h2>
      <p>
        From your account dashboard you can view your{" "}
        <button type="button" className="auth-inline-link" onClick={() => go("orders")}>
          recent orders
        </button>
        , manage your{" "}
        <button type="button" className="auth-inline-link" onClick={() => go("addresses")}>
          delivery addresses
        </button>
        , and{" "}
        <button type="button" className="auth-inline-link" onClick={() => go("details")}>
          edit your password and account details
        </button>
        .
      </p>
      <p className="checkout-notice account-guest-notice">
        You&apos;re browsing as a guest. <Link href="/account/login">Log in</Link> or{" "}
        <Link href="/account/register">create an account</Link> to keep your orders in one place.
      </p>
    </div>
  );
}

function Orders() {
  return (
    <div className="account-content">
      <h2>Orders</h2>
      <div className="account-empty">
        <p>No orders yet.</p>
        <Link href="/products" className="wishlist-return">
          Browse chairs
        </Link>
      </div>
    </div>
  );
}

function Addresses() {
  const [saved, setSaved] = useState<SavedAddress | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_ADDRESS_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from localStorage
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* storage unavailable */
    }
    setLoaded(true);
  }, []);

  const remove = () => {
    try {
      window.localStorage.removeItem(SAVED_ADDRESS_KEY);
    } catch {
      /* storage unavailable */
    }
    setSaved(null);
  };

  if (!loaded) return <div className="account-content" aria-busy="true" />;

  return (
    <div className="account-content">
      <h2>Addresses</h2>
      {saved?.address ? (
        <div className="account-address">
          <p className="account-address-tag">Saved on this device</p>
          <address>
            <strong>
              {saved.firstName} {saved.lastName}
            </strong>
            <br />
            {saved.address}
            {saved.apartment && (
              <>
                <br />
                {saved.apartment}
              </>
            )}
            <br />
            {saved.city}, {saved.state} {saved.pin}
            {saved.phone && (
              <>
                <br />
                {saved.phone}
              </>
            )}
          </address>
          <div className="account-address-actions">
            <Link href="/checkout">Edit at checkout</Link>
            <button type="button" className="auth-link-button" onClick={remove}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="account-empty">
          <p>No saved addresses yet. Tick &ldquo;Save this information&rdquo; at checkout to keep one here.</p>
        </div>
      )}
    </div>
  );
}

function Details() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", current: "", next: "", confirm: "" });
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState("");
  const update = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const errors: Partial<Record<keyof typeof form, string>> = {};
  if (touched) {
    if (!form.firstName.trim()) errors.firstName = "Enter your first name.";
    if (!form.lastName.trim()) errors.lastName = "Enter your last name.";
    if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address.";
    if (form.next || form.confirm || form.current) {
      if (!form.current) errors.current = "Enter your current password.";
      if (form.next.length < MIN_PASSWORD) errors.next = `Use at least ${MIN_PASSWORD} characters.`;
      if (form.confirm !== form.next) errors.confirm = "Passwords don't match.";
    }
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    const invalid =
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !EMAIL_PATTERN.test(form.email.trim()) ||
      ((form.next || form.confirm || form.current) &&
        (!form.current || form.next.length < MIN_PASSWORD || form.confirm !== form.next));
    // TODO: save to the account API once accounts exist
    setNotice(invalid ? "" : AUTH_NOT_CONNECTED);
  };

  return (
    <div className="account-content">
      <h2>Account Details</h2>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="field-row">
          <AuthField id="details-first" label="First name *" value={form.firstName} onChange={update("firstName")} error={errors.firstName} autoComplete="given-name" />
          <AuthField id="details-last" label="Last name *" value={form.lastName} onChange={update("lastName")} error={errors.lastName} autoComplete="family-name" />
        </div>
        <AuthField id="details-email" label="Email *" type="email" value={form.email} onChange={update("email")} error={errors.email} autoComplete="email" />

        <h3>Password change</h3>
        <AuthField id="details-current" label="Current password" type="password" value={form.current} onChange={update("current")} error={errors.current} autoComplete="current-password" />
        <AuthField id="details-next" label="New password" type="password" value={form.next} onChange={update("next")} error={errors.next} autoComplete="new-password" />
        <AuthField id="details-confirm" label="Confirm new password" type="password" value={form.confirm} onChange={update("confirm")} error={errors.confirm} autoComplete="new-password" />

        <button type="submit" className="add-to-cart auth-submit">
          Save changes
        </button>
        {notice && (
          <p className="checkout-notice auth-notice" role="status">
            {notice}
          </p>
        )}
      </form>
    </div>
  );
}

export default function AccountView() {
  const [active, setActive] = useState<SectionId>("dashboard");
  const { wishlist } = useStore();

  return (
    <div className="account-layout">
      <nav className="account-nav" aria-label="Account">
        <ul>
          {sections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                className={active === section.id ? "selected" : ""}
                aria-current={active === section.id ? "page" : undefined}
                onClick={() => setActive(section.id)}
              >
                {section.label}
              </button>
            </li>
          ))}
          <li>
            <Link href="/wishlist">Wishlist ({wishlist.length})</Link>
          </li>
          <li>
            <Link href="/account/login">Log in</Link>
          </li>
        </ul>
      </nav>

      {active === "dashboard" && <Dashboard go={setActive} />}
      {active === "orders" && <Orders />}
      {active === "addresses" && <Addresses />}
      {active === "details" && <Details />}
    </div>
  );
}
