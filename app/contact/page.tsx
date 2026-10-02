import type { Metadata } from "next";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";
import ContactForm from "../components/contact/ContactForm";
import { contact, primaryPhoneHref } from "../lib/site";

export const metadata: Metadata = {
  title: "Contact Us | Chamaro",
  description: "Questions about a chair, an order or a bulk purchase? Get in touch with the Chamaro team.",
};

export default function ContactPage() {
  return (
    <div className="site-shell">
      <Header />

      <section className="contact-hero">
        <div className="contact-hero-text">
          <h1>Contact Us</h1>
          <p>Questions about a chair, an order or a bulk purchase? We&apos;re happy to help.</p>
        </div>

        <div className="contact-hero-image">
          <Image src="/Banner two.webp" alt="" fill sizes="100vw" priority />
          <svg
            className="contact-hero-wave"
            viewBox="0 0 1200 60"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,0 C100,60 200,60 300,0 C400,60 500,60 600,0 C700,60 800,60 900,0 C1000,60 1100,60 1200,0 L1200,60 L0,60 Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      <main className="account-page">
        <div className="contact-layout">
          <section aria-labelledby="visit-title">
            <h2 id="visit-title" className="sr-only">
              Get in touch
            </h2>

            <ul className="contact-details contact-details-circle">
              <li>
                <span className="contact-icon-circle">
                  <Phone size={20} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div>
                  <h3>Phone Number</h3>
                  <p>
                    <a href={primaryPhoneHref}>{contact.phone}</a>
                  </p>
                </div>
              </li>
              <li>
                <span className="contact-icon-circle">
                  <Mail size={20} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div>
                  <h3>Email</h3>
                  <p>
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </p>
                </div>
              </li>
              <li>
                <span className="contact-icon-circle">
                  <MapPin size={20} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div>
                  <h3>Address</h3>
                  <p>
                    {contact.address.map((line, index) => (
                      <span key={line}>
                        {index > 0 && <br />}
                        {line}
                      </span>
                    ))}
                  </p>
                </div>
              </li>
            </ul>

            <div className="contact-map">
              <iframe
                src={contact.mapEmbedUrl}
                title="Chamaro showroom location"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>

          <section className="contact-form-panel contact-form-panel-plain" aria-labelledby="message-title">
            <h2 id="message-title" className="contact-form-title">
              Let&apos;s Talk
            </h2>
            <p className="auth-lead">
              Have a question or a requirement?
              <br />
              Fill out the form below and our team will get in touch with you.
            </p>
            <ContactForm />
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
