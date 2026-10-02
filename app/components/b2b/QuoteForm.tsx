"use client";

import { useState } from "react";
import { EMAIL_PATTERN, PHONE_PATTERN, contact, mailtoHref } from "../../lib/site";
import FormField from "../FormField";

const BUSINESS_TYPES = [
  "Corporate / Office",
  "Café / Restaurant",
  "Hotel / Hospitality",
  "Educational Institution",
  "Interior / Architecture",
  "Dealer / Distributor",
  "Other",
];

const PRODUCTS = [
  "Office Chairs",
  "Executive Chairs",
  "Café Chairs",
  "Conference Chairs",
  "Visitor Chairs",
  "Other",
];

type Form = {
  company: string;
  name: string;
  phone: string;
  email: string;
  businessType: string;
  city: string;
  product: string;
  quantity: string;
};

const EMPTY: Form = {
  company: "",
  name: "",
  phone: "",
  email: "",
  businessType: "",
  city: "",
  product: "",
  quantity: "",
};

function validate(form: Form) {
  const errors: Partial<Record<keyof Form, string>> = {};
  if (!form.company.trim()) errors.company = "Enter your company name.";
  if (!form.name.trim()) errors.name = "Enter your name.";
  if (!PHONE_PATTERN.test(form.phone.replace(/\s/g, ""))) errors.phone = "Enter a 10-digit mobile number.";
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (!form.businessType) errors.businessType = "Select a business type.";
  if (!form.city.trim()) errors.city = "Enter your city.";
  if (!form.product) errors.product = "Select the products you need.";
  if (!form.quantity.trim()) errors.quantity = "Enter an approximate quantity.";
  return errors;
}

export default function QuoteForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);

  const errors = touched ? validate(form) : {};
  const update = (key: keyof Form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(validate(form)).length > 0) return;

    // TODO: post to a quotes API / CRM once one exists
    window.location.href = mailtoHref(`B2B enquiry — ${form.company.trim()}`, [
      ["Company", form.company],
      ["Contact name", form.name],
      ["Phone", form.phone],
      ["Email", form.email],
      ["Business type", form.businessType],
      ["City", form.city],
      ["Products required", form.product],
      ["Quantity required", form.quantity],
    ]);
    setSent(true);
  };

  return (
    <form className="auth-form quote-form-underline" onSubmit={submit} noValidate>
      <h3 className="quote-form-title">B2B Enquiry Form</h3>

      <div className="field-row">
        <FormField
          id="quote-company"
          label="Business / Company Name *"
          value={form.company}
          onChange={update("company")}
          error={errors.company}
          autoComplete="organization"
          className="field-underline"
        />
        <FormField
          id="quote-name"
          label="Contact Person Name *"
          value={form.name}
          onChange={update("name")}
          error={errors.name}
          autoComplete="name"
          className="field-underline"
        />
      </div>

      <div className="field-row">
        <FormField
          id="quote-phone"
          label="Phone Number *"
          type="tel"
          inputMode="tel"
          value={form.phone}
          onChange={update("phone")}
          error={errors.phone}
          autoComplete="tel"
          className="field-underline"
        />
        <FormField
          id="quote-email"
          label="Email Address *"
          type="email"
          value={form.email}
          onChange={update("email")}
          error={errors.email}
          autoComplete="email"
          className="field-underline"
        />
      </div>

      <div className="field-row">
        <FormField
          id="quote-business-type"
          as="select"
          label="Business Type *"
          options={BUSINESS_TYPES}
          value={form.businessType}
          onChange={update("businessType")}
          error={errors.businessType}
          className="field-underline"
        />
        <FormField
          id="quote-city"
          label="City / Location *"
          value={form.city}
          onChange={update("city")}
          error={errors.city}
          autoComplete="address-level2"
          className="field-underline"
        />
      </div>

      <div className="field-row">
        <FormField
          id="quote-product"
          as="select"
          label="Products Required *"
          options={PRODUCTS}
          value={form.product}
          onChange={update("product")}
          error={errors.product}
          className="field-underline"
        />
        <FormField
          id="quote-quantity"
          label="Quantity Required *"
          value={form.quantity}
          onChange={update("quantity")}
          error={errors.quantity}
          inputMode="numeric"
          className="field-underline"
        />
      </div>

      <button type="submit" className="add-to-cart auth-submit">
        Submit B2B Enquiry
      </button>

      <p className="quote-form-hint">
        Our B2B team will review your requirement and get in touch with you shortly.
      </p>

      {sent && (
        <p className="checkout-notice auth-notice" role="status">
          Your email app should now be open with your enquiry filled in. Press send there to reach our team. If
          nothing opened, email us at <a href={`mailto:${contact.email}`}>{contact.email}</a>.
        </p>
      )}
    </form>
  );
}
