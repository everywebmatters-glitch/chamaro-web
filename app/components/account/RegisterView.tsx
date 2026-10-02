"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { authErrorMessage, registerCustomer } from "../../lib/auth-api";
import { useAuth } from "../auth/AuthProvider";
import AuthField, { EMAIL_PATTERN, MAX_PASSWORD, MIN_PASSWORD } from "./AuthField";
import SocialSignIn from "./SocialSignIn";

type Form = { name: string; email: string; password: string; agree: boolean };
const EMPTY: Form = { name: "", email: "", password: "", agree: false };

/* Only a same-site path is safe to bounce back to */
function safeRedirect(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function validate(form: Form) {
  const errors: Partial<Record<keyof Form, string>> = {};
  if (!form.name.trim()) errors.name = "Enter your name.";
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.password.length < MIN_PASSWORD)
    errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  else if (form.password.length > MAX_PASSWORD)
    errors.password = `Use at most ${MAX_PASSWORD} characters.`;
  if (!form.agree) errors.agree = "Please agree to the Terms & Privacy to continue.";
  return errors;
}

export default function RegisterView() {
  const router = useRouter();
  const redirect = safeRedirect(useSearchParams().get("redirect"));
  const { status, login } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* Signed in (after registering, or already): go to the account page, or back where checkout sent us */
  useEffect(() => {
    if (status === "authenticated") router.replace(redirect);
  }, [status, router, redirect]);

  const errors = touched ? validate(form) : {};
  if (emailTaken) errors.email = "An account with this email already exists.";
  const update = (key: "name" | "email" | "password") => (value: string) => {
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
        name: form.name.trim(),
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
    <div className="auth-split">
      <aside className="auth-split-panel" aria-hidden="true">
        <p className="auth-split-eyebrow">Join Chamaro</p>
        <h2 className="auth-split-headline">
          Chairs engineered
          <br />
          to lead your day
        </h2>
        <p className="auth-split-copy">
          Create an account to track orders, save favorites and get early
          access to new collections.
        </p>
      </aside>

      <section className="auth-split-form" aria-labelledby="register-title">
        <h2 id="register-title">Get Started Now</h2>
        <p className="auth-lead">Please sign up to continue.</p>

        {/* method="post": a submit before hydration must not put credentials in the URL */}
        <form className="auth-form" method="post" onSubmit={submit} noValidate>
          <AuthField
            id="register-name"
            label="Name *"
            value={form.name}
            onChange={update("name")}
            error={errors.name}
            autoComplete="name"
          />

          <AuthField
            id="register-email"
            label="Email address *"
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

          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(event) =>
                setForm((current) => ({ ...current, agree: event.target.checked }))
              }
            />
            <span>
              I agree to the <Link href="#">Terms &amp; Privacy</Link>
            </span>
          </label>
          {errors.agree && <p className="field-error">{errors.agree}</p>}

          <button
            type="submit"
            className="add-to-cart auth-submit"
            disabled={submitting}
            aria-busy={submitting || undefined}
          >
            {submitting ? "Creating account…" : "Sign up"}
          </button>

          {notice && (
            <p className="checkout-notice auth-notice" role="status">
              {notice}
            </p>
          )}

          <p className="auth-switch">
            Already have an account?{" "}
            <Link href={`/account/login?redirect=${encodeURIComponent(redirect)}`}>
              Log in here
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </p>

          <p className="social-divider">
            <span>Or</span>
          </p>

          <SocialSignIn action="Sign up" include={["google", "apple"]} showDivider={false} />
        </form>
      </section>
    </div>
  );
}
