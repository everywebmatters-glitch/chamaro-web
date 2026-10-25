import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Armchair,
  ArrowRight,
  Camera,
  ChartNoAxesCombined,
  Handshake,
  Mail,
  MapPin,
  MessageCircle,
  Play,
  Phone,
  Settings,
  ThumbsUp,
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

export default function B2BPage() {
  return (
    <div className="site-shell">
      <Header />

      <main>
        {/* Intro */}
        <section className="b2b-hero">
          <Image
            className="b2b-hero-background"
            src="/hero/b2b-business-chair.webp"
            alt="Ergonomic office chair"
            fill
            sizes="100vw"
            priority
          />
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
            <div className="b2b-quote-form">
              <h2 id="b2b-quote-title">Tell Us What Your Business Needs</h2>
              <QuoteForm />
            </div>

            <aside className="b2b-contact-card" aria-label="Contact Chamaro">
              <div className="b2b-contact-details">
                <div>
                  <Phone size={18} aria-hidden="true" />
                  <h3>Phone Number</h3>
                  <a href={primaryPhoneHref}>{contact.phone}</a>
                </div>
                <div>
                  <Mail size={18} aria-hidden="true" />
                  <h3>Email</h3>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </div>
                <div>
                  <MapPin size={18} aria-hidden="true" />
                  <h3>Address</h3>
                  <a href={contact.mapUrl} target="_blank" rel="noreferrer">
                    {contact.address.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </a>
                </div>
              </div>

              <div className="b2b-socials">
                <p>Stay Connected</p>
                <div>
                  <a href="https://www.instagram.com/chamarochair" target="_blank" rel="noreferrer" aria-label="Instagram"><Camera size={20} /></a>
                  <a href="https://wa.me/919741418807" target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={20} /></a>
                  <a href="https://www.facebook.com/share/1cf9KjWwgm" target="_blank" rel="noreferrer" aria-label="Facebook"><ThumbsUp size={20} /></a>
                  <a href="https://youtube.com/@chamarochairs" target="_blank" rel="noreferrer" aria-label="YouTube"><Play size={20} /></a>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
