import { CreditCard, Headset, ShieldCheck, Truck } from "lucide-react";

const highlights = [
  {
    icon: Truck,
    title: "Nationwide Delivery",
    description: "Reliable shipping to your doorstep",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Safe and flexible payment options",
  },
  {
    icon: ShieldCheck,
    title: "1-Year Warranty",
    description: "Quality you can trust, guaranteed",
  },
  {
    icon: Headset,
    title: "Dedicated Support",
    description: "We're here whenever you need us",
  },
] as const;

export default function ServiceHighlights() {
  return (
    <section className="service-highlights" aria-label="Why shop with Chamaro">
      <ul className="service-grid">
        {highlights.map(({ icon: Icon, title, description }) => (
          <li key={title} className="service-card">
            <Icon size={30} strokeWidth={1.2} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
