import type { Metadata } from "next";
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
        <div className="page-title-band">
          <h1>Cart</h1>
        </div>

        <div className="cart-page">
          <CartPageView />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
