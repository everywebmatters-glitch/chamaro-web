import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";
import CartPageView from "../components/cart/CartPageView";

export const metadata: Metadata = {
  title: "Shopping Cart | Chamaro",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="site-shell">
      <Header />

      <main>
        <section className="page-hero page-hero-compact" aria-labelledby="cart-title">
          <div className="page-hero-inner">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <ol>
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li aria-current="page">Shopping Cart</li>
              </ol>
            </nav>
            <h1 id="cart-title">Shopping Cart</h1>
          </div>
        </section>

        <div className="cart-page">
          <CartPageView />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
