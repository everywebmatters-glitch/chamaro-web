"use client";

import { useRef, useState } from "react";
import { ApiError } from "../../lib/api";
import { submitB2BEnquiry } from "../../lib/b2b-enquiries-api";
import { EMAIL_PATTERN, PHONE_PATTERN, contact } from "../../lib/site";
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
  message: string;
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
  message: "",
};

function validate(form: Form) {
  const errors: Partial<Record<keyof Form, string>> = {};
  if (!form.company.trim()) errors.company = "Enter your company name.";
  else if (form.company.trim().length > 191) errors.company = "Company name must be 191 characters or fewer.";
  if (!form.name.trim()) errors.name = "Enter your name.";
  else if (form.name.trim().length > 191) errors.name = "Name must be 191 characters or fewer.";
  if (form.phone.trim().length > 16 || !PHONE_PATTERN.test(form.phone.trim().replace(/\s/g, "")))
    errors.phone = "Enter a valid Indian mobile number.";
  if (form.email.trim().length > 191 || !EMAIL_PATTERN.test(form.email.trim()))
    errors.email = "Enter a valid email address (191 characters or fewer).";
  if (!form.businessType) errors.businessType = "Select a business type.";
  if (!form.city.trim()) errors.city = "Enter your city.";
  if (!form.product) errors.product = "Select the products you need.";
  if (!/^[1-9]\d*$/.test(form.quantity.trim()) || Number(form.quantity) > 1_000_000)
    errors.quantity = "Enter a whole quantity from 1 to 1,000,000.";
  if (form.message.trim().length < 10) errors.message = "Add a message of at least 10 characters.";
  else if (form.message.trim().length > 9_500) errors.message = "Keep your message under 9,500 characters.";
  return errors;
}

export default function QuoteForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const submissionInProgress = useRef(false);

  const errors = touched ? validate(form) : {};
  const update = (key: keyof Form) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setNotice("");
    setSent(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(validate(form)).length > 0) return;

    if (submissionInProgress.current) return;
    submissionInProgress.current = true;
    setSubmitting(true);
    setNotice("");

    try {
      await submitB2BEnquiry({
        name: form.name.trim(),
        companyName: form.company.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        productType: form.product,
        quantity: Number(form.quantity),
        message: `Business type: ${form.businessType}\nCity / location: ${form.city}\n\n${form.message.trim()}`,
      });
      setForm(EMPTY);
      setTouched(false);
      setSent(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) {
        setNotice("We couldn't reach the server. Please check your connection and try again.");
      } else if (error instanceof ApiError && error.status === 429) {
        setNotice("Too many requests. Please wait a moment and try again.");
      } else if (error instanceof ApiError && error.status === 400) {
        setNotice("Please check the form details and try again.");
      } else {
        setNotice(`We couldn't submit your request. Please try again or email ${contact.email}.`);
      }
    } finally {
      submissionInProgress.current = false;
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form b2b-request-form" onSubmit={submit} noValidate>

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

      <FormField
        id="quote-message"
        as="textarea"
        label="Tell us about your requirement *"
        value={form.message}
        onChange={update("message")}
        error={errors.message}
        rows={5}
        className="field-underline"
      />

      <button type="submit" className="add-to-cart auth-submit" disabled={submitting} aria-busy={submitting || undefined}>
        {submitting ? "Sending request…" : "Request a B2B Quote"}
      </button>

      <p className="quote-form-hint">
        Our B2B team will review your requirement and get in touch with you shortly.
      </p>

      {sent && (
        <p className="checkout-notice auth-notice" role="status">
          Thanks — your B2B enquiry has been received. Our team will get in touch with you shortly.
        </p>
      )}
      {notice && (
        <p className="checkout-notice auth-notice" role="alert">
          {notice}
        </p>
      )}
    </form>
  );
}
