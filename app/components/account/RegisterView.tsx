"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import AuthField, { AUTH_NOT_CONNECTED, EMAIL_PATTERN, MIN_PASSWORD } from "./AuthField";
import SocialSignIn from "./SocialSignIn";

type Form = { firstName: string; lastName: string; email: string; password: string };
const EMPTY: Form = { firstName: "", lastName: "", email: "", password: "" };

function validate(form: Form) {
  const errors: Partial<Record<keyof Form, string>> = {};
  if (!form.firstName.trim()) errors.firstName = "Enter your first name.";
  if (!form.lastName.trim()) errors.lastName = "Enter your last name.";
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.password.length < MIN_PASSWORD)
    errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  return errors;
}

export default function RegisterView() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState("");

  const errors = touched ? validate(form) : {};
  const update = (key: keyof Form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(validate(form)).length > 0) {
      setNotice("");
      return;
    }
    // TODO: call the registration API once accounts exist
    setNotice(AUTH_NOT_CONNECTED);
  };

  return (
    <section className="auth-panel auth-single" aria-labelledby="register-title">
      <h2 id="register-title">Register</h2>
      <p className="auth-lead">
        Sign up for faster checkout, order tracking and early access to new chairs.
      </p>

      <SocialSignIn action="Sign up" />

      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="field-row">
          <AuthField
            id="register-first-name"
            label="First name *"
            value={form.firstName}
            onChange={update("firstName")}
            error={errors.firstName}
            autoComplete="given-name"
          />
          <AuthField
            id="register-last-name"
            label="Last name *"
            value={form.lastName}
            onChange={update("lastName")}
            error={errors.lastName}
            autoComplete="family-name"
          />
        </div>

        <AuthField
          id="register-email"
          label="Email *"
          type="email"
          value={form.email}
          onChange={update("email")}
          error={errors.email}
          autoComplete="email"
        />

        <AuthField
          id="register-password"
          label="Password *"
          type="password"
          value={form.password}
          onChange={update("password")}
          error={errors.password}
          autoComplete="new-password"
        />
        {!errors.password && (
          <p className="auth-hint">At least {MIN_PASSWORD} characters.</p>
        )}

        <button type="submit" className="add-to-cart auth-submit">
          Register
        </button>

        {notice && (
          <p className="checkout-notice auth-notice" role="status">
            {notice}
          </p>
        )}

        <p className="auth-switch">
          Already have an account?{" "}
          <Link href="/account/login">
            Log in here
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </p>
      </form>
    </section>
  );
}
