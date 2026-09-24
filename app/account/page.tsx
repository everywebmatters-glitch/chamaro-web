import type { Metadata } from "next";
import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";
import AccountView from "../components/account/AccountView";

export const metadata: Metadata = {
  title: "My Account | Chamaro",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <div className="site-shell">
      <Header />

      <div className="page-title-band">
        <h1>My Account</h1>
      </div>

      <main className="account-page">
        <AccountView />
      </main>

      <SiteFooter />
    </div>
  );
}
