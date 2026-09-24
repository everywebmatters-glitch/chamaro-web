import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import CheckoutView from "../components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout | Chamaro",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="checkout-shell">
      {/* Minimal header keeps the shopper focused on completing the order */}
      <header className="checkout-header">
        <div className="checkout-header-inner">
          <Link href="/" aria-label="Chamaro home">
            <Image src="/Carmaro Logo 1.svg" alt="Chamaro" width={150} height={33} priority />
          </Link>
          <Link href="/cart" className="checkout-cart-link" aria-label="Back to cart">
            <ShoppingBag size={22} strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      <main>
        <CheckoutView />
      </main>
    </div>
  );
}
