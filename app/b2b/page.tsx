import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Armchair,
  ArrowRight,
  ChartNoAxesCombined,
  Handshake,
  Settings,
} from "lucide-react";
import Header from "../components/Header";
import SiteFooter, { FooterSocialLinks } from "../components/SiteFooter";
import QuoteForm from "../components/b2b/QuoteForm";
import { getB2bHero } from "../lib/catalog-api";
import { contact, primaryPhoneHref } from "../lib/site";

export const metadata: Metadata = {
  title: "B2B & Bulk Orders | Chamaro",
  description:
    "Office chairs for teams of every size. Request a bulk quote with volume pricing and GST invoices from Chamaro.",
};

const benefits = [
  {
    icon: ChartNoAxesCombined,
    title: "Grow Your Sales",
    text: "Expand your product portfolio with our diverse range of office chairs and seating solutions for different business needs.",
  },
  {
    icon: Armchair,
    title: "Diverse Product Range",
    text: "From executive chairs to visitor chairs, explore seating solutions for every workspace, customer, and budget.",
  },
  {
    icon: Settings,
    title: "Reliable Manufacturing",
    text: "Discover quality-focused manufacturing, functional designs, and dependable products for your business.",
  },
  {
    icon: Handshake,
    title: "Long-Term Partnership",
    text: "Build a lasting business relationship with product information, marketing support, and dedicated assistance.",
  },
];

export default async function B2BPage() {
  const hero = await getB2bHero();

  return (
    <div className="site-shell">
      <Header overlay />

      <main>
        {/* Intro */}
        <section className="b2b-hero hero" style={{ "--hero-bg": "#ffffff" } as React.CSSProperties}>
          <div className="b2b-hero-banner-image">
            <Image
              className="b2b-hero-background"
              src={hero.imageUrl}
              alt={hero.imageAlt}
              fill
              sizes="100vw"
              priority
            />
          </div>
          <div className="b2b-hero-copy">
            <p className="b2b-eyebrow">{hero.eyebrow}</p>
            <h1 className="hero-title">{hero.title}</h1>
            <p className="hero-subtitle">{hero.description}</p>
            <div className="b2b-actions">
              <a href={hero.buttonUrl} className="hero-cta">
                {hero.buttonLabel}
                <ArrowRight size={18} aria-hidden="true" />
              </a>
              <Link href="/products" className="wishlist-return">
                Browse chairs
              </Link>
            </div>
          </div>

        </section>

        {/* Benefits */}
        <section className="b2b-section" aria-labelledby="b2b-why">
          <h2 id="b2b-why" className="b2b-heading">
            More Value for Your Business
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

        {/* Quote form and direct contact */}
        <section className="b2b-section b2b-request-section" aria-labelledby="b2b-quote-title">
          <div className="b2b-quote" id="quote">
            <h2 className="b2b-quote-title" id="b2b-quote-title">
              Tell Us What Your Business Needs
            </h2>
            <div className="b2b-quote-form">
              <QuoteForm />
            </div>

            <aside className="b2b-contact-card" aria-label="Contact Chamaro">
              <ul className="b2b-contact-details contact-details">
                <li>
                  <div>
                    <h3>Phone Number</h3>
                    <p><a href={primaryPhoneHref}>{contact.phone}</a></p>
                  </div>
                </li>
                <li>
                  <div>
                    <h3>Email</h3>
                    <p><a href={`mailto:${contact.email}`}>{contact.email}</a></p>
                  </div>
                </li>
                <li>
                  <div>
                    <h3>Address</h3>
                    <p>
                      <a href={contact.mapUrl} target="_blank" rel="noreferrer">
                        {contact.address.map((line, index) => (
                          <span key={line}>
                            {index > 0 && <br />}
                            {line}
                          </span>
                        ))}
                      </a>
                    </p>
                  </div>
                </li>
              </ul>

              <div className="b2b-socials">
                <p>Stay Connected</p>
                <FooterSocialLinks className="footer-social b2b-footer-social" />
              </div>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
