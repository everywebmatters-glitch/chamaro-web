"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { authErrorMessage, registerCustomer } from "../../lib/auth-api";
import { useAuth } from "../auth/AuthProvider";
import AuthField, { EMAIL_PATTERN, MAX_PASSWORD, MIN_PASSWORD } from "./AuthField";
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
  else if (form.password.length > MAX_PASSWORD)
    errors.password = `Use at most ${MAX_PASSWORD} characters.`;
  return errors;
}

export default function RegisterView() {
  const router = useRouter();
  const { status, login } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* Signed in (after registering, or already): go to the account page */
  useEffect(() => {
    if (status === "authenticated") router.replace("/account");
  }, [status, router]);

  const errors = touched ? validate(form) : {};
  if (emailTaken) errors.email = "An account with this email already exists.";
  const update = (key: keyof Form) => (value: string) => {
    if (key === "email") setEmailTaken(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(validate(form)).length > 0) {
      setNotice("");
      return;
    }

    const email = form.email.trim();
    setSubmitting(true);
    setNotice("");
    try {
      await registerCustomer({
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email,
        password: form.password,
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === "DUPLICATE_RECORD") setEmailTaken(true);
      setNotice(authErrorMessage(error));
      setSubmitting(false);
      return;
    }

    /* Registration doesn't return a token, so sign in with the same details */
    try {
      await login(email, form.password);
    } catch {
      setNotice("Your account was created. Please log in to continue.");
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-panel auth-single" aria-labelledby="register-title">
      <h2 id="register-title">Register</h2>
      <p className="auth-lead">
        Sign up for faster checkout, order tracking and early access to new chairs.
      </p>

      <SocialSignIn action="Sign up" />

      {/* method="post": a submit before hydration must not put credentials in the URL */}
      <form className="auth-form" method="post" onSubmit={submit} noValidate>
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

        <button
          type="submit"
          className="add-to-cart auth-submit"
          disabled={submitting}
          aria-busy={submitting || undefined}
        >
          {submitting ? "Creating account…" : "Register"}
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
