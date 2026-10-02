"use client";

import Link from "next/link";
import { useState } from "react";
import { EMAIL_PATTERN, PHONE_PATTERN, contact, mailtoHref } from "../../lib/site";

const TOPICS = [
  "General question",
  "Help choosing a chair",
  "Order & delivery",
  "Returns & warranty",
  "Bulk / business order",
];

type Form = { name: string; topic: string; contact: string; message: string };
const EMPTY: Form = { name: "", topic: "", contact: "", message: "" };

function validate(form: Form) {
  const errors: Partial<Record<keyof Form, string>> = {};
  if (!form.name.trim()) errors.name = "Enter your name.";
  if (!form.topic) errors.topic = "Choose a category.";
  const contactValue = form.contact.trim();
  if (!contactValue) errors.contact = "Enter an email or mobile number.";
  else if (!EMAIL_PATTERN.test(contactValue) && !PHONE_PATTERN.test(contactValue.replace(/\s/g, "")))
    errors.contact = "Enter a valid email or 10-digit mobile number.";
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
      ["Category", form.topic],
      ["Email or phone", form.contact],
      ["Message", form.message],
    ]);
    setSent(true);
  };

  return (
    <form className="contact-plain-form" onSubmit={submit} noValidate>
      <div className="contact-plain-row">
        <div className="contact-plain-field">
          <input
            id="contact-name"
            name="name"
            value={form.name}
            onChange={(event) => update("name")(event.target.value)}
            placeholder="Name"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
          />
          {errors.name && (
            <p className="field-error" id="contact-name-error">
              {errors.name}
            </p>
          )}
        </div>

        <div className="contact-plain-field">
          <select
            id="contact-topic"
            name="topic"
            value={form.topic}
            onChange={(event) => update("topic")(event.target.value)}
            data-empty={form.topic ? "false" : "true"}
            aria-invalid={errors.topic ? true : undefined}
            aria-describedby={errors.topic ? "contact-topic-error" : undefined}
          >
            <option value="" disabled hidden>
              Category
            </option>
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
          {errors.topic && (
            <p className="field-error" id="contact-topic-error">
              {errors.topic}
            </p>
          )}
        </div>
      </div>

      <div className="contact-plain-field">
        <input
          id="contact-value"
          name="contact"
          value={form.contact}
          onChange={(event) => update("contact")(event.target.value)}
          placeholder="Email or Phone Number"
          autoComplete="email"
          aria-invalid={errors.contact ? true : undefined}
          aria-describedby={errors.contact ? "contact-value-error" : undefined}
        />
        {errors.contact && (
          <p className="field-error" id="contact-value-error">
            {errors.contact}
          </p>
        )}
      </div>

      {form.topic === "Bulk / business order" && (
        <p className="contact-tip">
          Buying for an office? The <Link href="/b2b#quote">bulk quote form</Link> asks for everything we need to price
          your order.
        </p>
      )}

      <div className="contact-plain-field">
        <textarea
          id="contact-message"
          name="message"
          value={form.message}
          onChange={(event) => update("message")(event.target.value)}
          placeholder="Write Message Here..."
          rows={6}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
        {errors.message && (
          <p className="field-error" id="contact-message-error">
            {errors.message}
          </p>
        )}
      </div>

      <button type="submit" className="contact-send-btn">
        Send Message
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
