"use client";

import { useState } from "react";
import { categories } from "../../lib/products";
import { EMAIL_PATTERN, GSTIN_PATTERN, PHONE_PATTERN, contact, mailtoHref } from "../../lib/site";
import FormField from "../FormField";

const QUANTITIES = ["Under 10 chairs", "10 – 25 chairs", "26 – 50 chairs", "51 – 100 chairs", "More than 100 chairs"];
const TIMELINES = ["As soon as possible", "Within a month", "In 1 – 3 months", "Just exploring"];

type Form = {
  company: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  gstin: string;
  quantity: string;
  timeline: string;
  message: string;
};

const EMPTY: Form = {
  company: "",
  name: "",
  email: "",
  phone: "",
  city: "",
  gstin: "",
  quantity: "",
  timeline: "",
  message: "",
};

function validate(form: Form, chairs: string[]) {
  const errors: Partial<Record<keyof Form | "chairs", string>> = {};
  if (!form.company.trim()) errors.company = "Enter your company or organisation name.";
  if (!form.name.trim()) errors.name = "Enter your name.";
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid work email address.";
  if (!PHONE_PATTERN.test(form.phone.replace(/\s/g, ""))) errors.phone = "Enter a 10-digit mobile number.";
  if (!form.city.trim()) errors.city = "Enter the delivery city.";
  if (form.gstin.trim() && !GSTIN_PATTERN.test(form.gstin.trim().toUpperCase()))
    errors.gstin = "Enter a valid 15-character GSTIN, or leave this blank.";
  if (chairs.length === 0) errors.chairs = "Pick at least one type of chair.";
  if (!form.quantity) errors.quantity = "Choose roughly how many chairs you need.";
  if (!form.timeline) errors.timeline = "Choose when you need them.";
  return errors;
}

export default function QuoteForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [chairs, setChairs] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);

  const errors = touched ? validate(form, chairs) : {};
  const update = (key: keyof Form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  const toggleChair = (name: string) =>
    setChairs((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(validate(form, chairs)).length > 0) return;

    // TODO: post to a quotes API / CRM once one exists
    window.location.href = mailtoHref(`Bulk order enquiry — ${form.company.trim()}`, [
      ["Company", form.company],
      ["Contact name", form.name],
      ["Email", form.email],
      ["Phone", form.phone],
      ["Delivery city", form.city],
      ["GSTIN", form.gstin.toUpperCase()],
      ["Chairs", chairs.join(", ")],
      ["Quantity", form.quantity],
      ["Needed", form.timeline],
      ["Details", form.message],
    ]);
    setSent(true);
  };

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <div className="field-row">
        <FormField id="quote-company" label="Company name *" value={form.company} onChange={update("company")} error={errors.company} autoComplete="organization" />
        <FormField id="quote-name" label="Your name *" value={form.name} onChange={update("name")} error={errors.name} autoComplete="name" />
      </div>
      <div className="field-row">
        <FormField id="quote-email" label="Work email *" type="email" value={form.email} onChange={update("email")} error={errors.email} autoComplete="email" />
        <FormField id="quote-phone" label="Mobile number *" type="tel" inputMode="tel" value={form.phone} onChange={update("phone")} error={errors.phone} autoComplete="tel" />
      </div>
      <div className="field-row">
        <FormField id="quote-city" label="Delivery city *" value={form.city} onChange={update("city")} error={errors.city} autoComplete="address-level2" />
        <FormField id="quote-gstin" label="GSTIN (optional)" value={form.gstin} onChange={update("gstin")} error={errors.gstin} />
      </div>

      <fieldset className="quote-chairs" aria-describedby={errors.chairs ? "quote-chairs-error" : undefined}>
        <legend>Chairs you&apos;re interested in *</legend>
        <div className="quote-chips">
          {categories.map((category) => (
            <label key={category.slug} className="quote-chip">
              <input
                type="checkbox"
                checked={chairs.includes(category.name)}
                onChange={() => toggleChair(category.name)}
              />
              <span>{category.name}</span>
            </label>
          ))}
        </div>
        {errors.chairs && (
          <p className="field-error" id="quote-chairs-error">
            {errors.chairs}
          </p>
        )}
      </fieldset>

      <div className="field-row">
        <FormField id="quote-quantity" as="select" label="How many chairs? *" options={QUANTITIES} value={form.quantity} onChange={update("quantity")} error={errors.quantity} />
        <FormField id="quote-timeline" as="select" label="Needed by *" options={TIMELINES} value={form.timeline} onChange={update("timeline")} error={errors.timeline} />
      </div>

      <FormField id="quote-message" as="textarea" label="Anything else? (colours, delivery floor, deadlines…)" value={form.message} onChange={update("message")} />

      <button type="submit" className="add-to-cart auth-submit">
        Request a quote
      </button>

      {sent && (
        <p className="checkout-notice auth-notice" role="status">
          Your email app should now be open with your enquiry filled in. Press send there to reach our team. If
          nothing opened, email us at <a href={`mailto:${contact.email}`}>{contact.email}</a>.
        </p>
      )}
    </form>
  );
}
