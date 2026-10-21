import type { Metadata } from "next";
import Header from "../../components/Header";
import SiteFooter from "../../components/SiteFooter";
import OrdersList from "../../components/account/OrdersList";

export const metadata: Metadata = {
  title: "My Orders | Chamaro",
  robots: { index: false },
};

export default function OrdersPage() {
  return (
    <div className="site-shell">
      <Header />

      <div className="page-title-band">
        <h1>My Orders</h1>
      </div>

      <main className="account-page">
        <OrdersList showHeading={false} />
      </main>

      <SiteFooter />
    </div>
  );
}
