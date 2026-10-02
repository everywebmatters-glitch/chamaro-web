import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Armchair,
  ArrowRight,
  BadgePercent,
  Headset,
  Mail,
  Phone,
  ReceiptText,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";
import QuoteForm from "../components/b2b/QuoteForm";
import { contact, primaryPhoneHref } from "../lib/site";

export const metadata: Metadata = {
  title: "B2B & Bulk Orders | Chamaro",
  description:
    "Office chairs for teams of every size. Request a bulk quote with volume pricing and GST invoices from Chamaro.",
};

/* TODO: confirm these commercial terms with the business before launch */
const benefits = [
  { icon: BadgePercent, title: "Volume pricing", text: "Better per-chair prices as your order grows." },
  { icon: ReceiptText, title: "GST invoices", text: "Invoices with your GSTIN so you can claim input tax credit." },
  { icon: Armchair, title: "Help choosing", text: "Tell us about your space and we'll suggest the right mix of chairs." },
  { icon: Truck, title: "Planned delivery", text: "One delivery schedule for the whole order, planned around your site." },
  { icon: ShieldCheck, title: "1-year warranty", text: "Every chair is covered, however many you buy." },
  { icon: Headset, title: "One point of contact", text: "A single person to talk to, from quote to delivery." },
];

export default function B2BPage() {
  return (
    <div className="site-shell">
      <Header />

      <main>
        {/* Intro */}
        <section className="b2b-hero">
          <div className="b2b-hero-copy">
            <p className="b2b-eyebrow">Chamaro for Business</p>
            <h1>Seating for teams of every size</h1>
            <p>
              Furnishing a new office, a co-working floor or a café? Order in bulk with volume pricing, GST invoices
              and one team handling everything from quote to delivery.
            </p>
            <div className="b2b-actions">
              <a href="#quote" className="add-to-cart">
                Request a quote
                <ArrowRight size={18} aria-hidden="true" />
              </a>
              <Link href="/products" className="wishlist-return">
                Browse chairs
              </Link>
            </div>
          </div>

          <div className="b2b-hero-visual" aria-hidden="true">
            <span className="b2b-hero-circle" />
            <Image src="/hero/boss-green.webp" alt="" fill sizes="(max-width: 860px) 80vw, 40vw" priority />
          </div>
        </section>

        {/* Benefits */}
        <section className="b2b-section" aria-labelledby="b2b-why">
          <h2 id="b2b-why" className="b2b-heading">
            Why businesses choose Chamaro
          </h2>
          <ul className="b2b-benefit-grid">
            {benefits.map(({ icon: Icon, title, text }) => (
              <li key={title} className="b2b-benefit-card">
                <Icon size={32} strokeWidth={1.4} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Quote form */}
        <section className="b2b-section" aria-labelledby="b2b-quote-title">
          <div className="b2b-quote" id="quote">
            <div className="b2b-quote-intro">
              <p className="b2b-eyebrow">B2B Solutions</p>
              <h2 id="b2b-quote-title">Business Seating, Built for Every Space</h2>
              <p>
                At Chamaro, we provide reliable and stylish seating solutions for businesses, institutions, and
                commercial spaces. From individual requirements to large-scale projects, our B2B solutions are
                designed to meet your specific needs.
              </p>

              <Armchair className="b2b-quote-illustration" size={120} strokeWidth={1} aria-hidden="true" />

              <ul className="b2b-direct">
                <li>
                  <Phone size={18} aria-hidden="true" />
                  <a href={primaryPhoneHref}>{contact.phone}</a>
                </li>
                <li>
                  <Mail size={18} aria-hidden="true" />
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </li>
              </ul>
            </div>

            <div className="b2b-quote-form">
              <QuoteForm />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
