import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Armchair,
  ArrowRight,
  BadgePercent,
  Coffee,
  Headset,
  Mail,
  Phone,
  ReceiptText,
  ShieldCheck,
  Sofa,
  Truck,
  Users,
} from "lucide-react";
import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";
import QuoteForm from "../components/b2b/QuoteForm";
import { categories, products, type ProductCategory } from "../lib/products";
import { contact } from "../lib/site";

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

const spaces: Record<ProductCategory, { icon: typeof Armchair; use: string }> = {
  boss: { icon: Armchair, use: "Director cabins and leadership offices" },
  executive: { icon: Sofa, use: "Managers' desks and executive workstations" },
  visitor: { icon: Users, use: "Receptions, waiting areas and meeting rooms" },
  cafe: { icon: Coffee, use: "Cafeterias, break-out zones and cafés" },
};

const steps = [
  { title: "Tell us what you need", text: "Share the chairs, quantities and delivery city using the form below." },
  { title: "Get your quote", text: "We reply by email with pricing, lead times and GST details." },
  { title: "We deliver", text: "Confirm the order and we schedule delivery to your site." },
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
          <ul className="service-grid b2b-benefits">
            {benefits.map(({ icon: Icon, title, text }) => (
              <li key={title} className="service-card">
                <Icon size={40} strokeWidth={1.2} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Spaces */}
        <section className="b2b-section b2b-section-tinted" aria-labelledby="b2b-spaces">
          <h2 id="b2b-spaces" className="b2b-heading">
            Chairs for every space
          </h2>
          <ul className="b2b-spaces">
            {categories.map((category) => {
              const { icon: Icon, use } = spaces[category.slug];
              const count = products.filter((product) => product.category === category.slug).length;
              return (
                <li key={category.slug}>
                  <Link href={`/products?category=${category.slug}`} className="b2b-space">
                    <span className="b2b-space-icon">
                      <Icon size={30} strokeWidth={1.4} aria-hidden="true" />
                    </span>
                    <h3>{category.name} chairs</h3>
                    <p>{use}</p>
                    <span className="b2b-space-link">
                      View {count} {count === 1 ? "chair" : "chairs"}
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Process */}
        <section className="b2b-section" aria-labelledby="b2b-how">
          <h2 id="b2b-how" className="b2b-heading">
            How it works
          </h2>
          <ol className="b2b-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className="b2b-step-number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Quote form */}
        <section className="b2b-section b2b-quote" id="quote" aria-labelledby="b2b-quote-title">
          <div className="b2b-quote-intro">
            <h2 id="b2b-quote-title" className="b2b-heading">
              Request a bulk quote
            </h2>
            <p className="auth-lead">
              The more you tell us, the more accurate your quote. Prefer to talk? Reach the team directly.
            </p>
            <ul className="b2b-direct">
              <li>
                <Phone size={18} aria-hidden="true" />
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>
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
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
