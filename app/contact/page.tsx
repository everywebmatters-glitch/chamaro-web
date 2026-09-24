import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";
import ContactForm from "../components/contact/ContactForm";
import { contact } from "../lib/site";

export const metadata: Metadata = {
  title: "Contact Us | Chamaro",
  description: "Questions about a chair, an order or a bulk purchase? Get in touch with the Chamaro team.",
};

export default function ContactPage() {
  return (
    <div className="site-shell">
      <Header />

      <div className="page-title-band">
        <h1>Contact Us</h1>
        <p>Questions about a chair, an order or a bulk purchase? We&apos;re happy to help.</p>
      </div>

      <main className="account-page">
        <div className="contact-layout">
          <section aria-labelledby="visit-title">
            <h2 id="visit-title" className="contact-heading">
              Visit our showroom
            </h2>
            <p className="auth-lead">Come and try the chairs in person, or reach us by phone or email.</p>

            <ul className="contact-details">
              <li>
                <MapPin size={22} strokeWidth={1.5} aria-hidden="true" />
                <div>
                  <h3>Address</h3>
                  <p>
                    {contact.address[0]}
                    <br />
                    {contact.address[1]}
                  </p>
                  <a href={contact.mapUrl} target="_blank" rel="noreferrer" className="contact-direction">
                    Get directions
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                </div>
              </li>
              <li>
                <Phone size={22} strokeWidth={1.5} aria-hidden="true" />
                <div>
                  <h3>Phone</h3>
                  <p>
                    <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>
                  </p>
                </div>
              </li>
              <li>
                <Mail size={22} strokeWidth={1.5} aria-hidden="true" />
                <div>
                  <h3>Email</h3>
                  <p>
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </p>
                </div>
              </li>
              <li>
                <Clock size={22} strokeWidth={1.5} aria-hidden="true" />
                <div>
                  <h3>Open hours</h3>
                  <p>{contact.hours}</p>
                </div>
              </li>
            </ul>

            <div className="contact-b2b">
              <h3>Buying for an office?</h3>
              <p>Get volume pricing and GST invoices for bulk orders.</p>
              <Link href="/b2b" className="wishlist-return">
                Explore B2B
              </Link>
            </div>
          </section>

          <section className="contact-form-panel" aria-labelledby="message-title">
            <h2 id="message-title" className="contact-heading">
              Send us a message
            </h2>
            <p className="auth-lead">Fill in the form and we&apos;ll get back to you by email.</p>
            <ContactForm />
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
