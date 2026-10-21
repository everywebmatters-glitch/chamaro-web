import type { Metadata } from "next";
import Header from "../../../components/Header";
import SiteFooter from "../../../components/SiteFooter";
import OrderDetailView from "../../../components/account/OrderDetailView";

/* The order is fetched in the browser with the shopper's own sign-in; nothing about it is rendered on the server */
export const metadata: Metadata = {
  title: "Order details | Chamaro",
  robots: { index: false },
};

export default async function OrderPage(props: PageProps<"/account/orders/[id]">) {
  const { id } = await props.params;

  return (
    <div className="site-shell">
      <Header />

      <div className="page-title-band">
        <h1>Order details</h1>
      </div>

      <main className="account-page">
        <OrderDetailView orderId={id} />
      </main>

      <SiteFooter />
    </div>
  );
}
