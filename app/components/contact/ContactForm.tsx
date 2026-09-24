"use client";

import Link from "next/link";
import { useState } from "react";
import { EMAIL_PATTERN, PHONE_PATTERN, contact, mailtoHref } from "../../lib/site";
import FormField from "../FormField";

const TOPICS = [
  "General question",
  "Help choosing a chair",
  "Order & delivery",
  "Returns & warranty",
  "Bulk / business order",
];

type Form = { name: string; email: string; phone: string; topic: string; message: string };
const EMPTY: Form = { name: "", email: "", phone: "", topic: "", message: "" };

function validate(form: Form) {
  const errors: Partial<Record<keyof Form, string>> = {};
  if (!form.name.trim()) errors.name = "Enter your name.";
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.replace(/\s/g, "")))
    errors.phone = "Enter a 10-digit mobile number, or leave this blank.";
  if (!form.topic) errors.topic = "Choose what your message is about.";
  if (form.message.trim().length < 10) errors.message = "Tell us a little more (at least 10 characters).";
  return errors;
}

export default function ContactForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);

  const errors = touched ? validate(form) : {};
  const update = (key: keyof Form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(validate(form)).length > 0) return;

    // TODO: post to an enquiries API once one exists
    window.location.href = mailtoHref(`${form.topic} — ${form.name.trim()}`, [
      ["Name", form.name],
      ["Email", form.email],
      ["Phone", form.phone],
      ["Topic", form.topic],
      ["Message", form.message],
    ]);
    setSent(true);
  };

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <div className="field-row">
        <FormField id="contact-name" label="Name *" value={form.name} onChange={update("name")} error={errors.name} autoComplete="name" />
        <FormField id="contact-email" label="Email *" type="email" value={form.email} onChange={update("email")} error={errors.email} autoComplete="email" />
      </div>
      <div className="field-row">
        <FormField id="contact-phone" label="Phone (optional)" type="tel" inputMode="tel" value={form.phone} onChange={update("phone")} error={errors.phone} autoComplete="tel" />
        <FormField id="contact-topic" as="select" label="Topic *" options={TOPICS} value={form.topic} onChange={update("topic")} error={errors.topic} />
      </div>

      {form.topic === "Bulk / business order" && (
        <p className="contact-tip">
          Buying for an office? The <Link href="/b2b#quote">bulk quote form</Link> asks for everything we need to price
          your order.
        </p>
      )}

      <FormField id="contact-message" as="textarea" label="Message *" value={form.message} onChange={update("message")} error={errors.message} />

      <button type="submit" className="add-to-cart auth-submit">
        Send message
      </button>

      {sent && (
        <p className="checkout-notice auth-notice" role="status">
          Your email app should now be open with your message filled in. Press send there to reach us. If nothing
          opened, email us directly at <a href={`mailto:${contact.email}`}>{contact.email}</a>.
        </p>
      )}
    </form>
  );
}
