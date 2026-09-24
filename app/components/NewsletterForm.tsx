"use client";

import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

export default function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  /* TODO: connect to a newsletter API route once one exists */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
  };

  return (
    <>
      <form className="newsletter-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>

        <input
          id="newsletter-email"
          type="email"
          name="email"
          placeholder="Enter email address"
          autoComplete="email"
          required
        />

        <button type="submit">
          Subscribe
          <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </form>

      <p className="newsletter-status" role="status">
        {submitted ? "Thanks for subscribing!" : ""}
      </p>
    </>
  );
}
