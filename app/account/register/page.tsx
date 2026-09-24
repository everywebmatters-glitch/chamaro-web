import type { Metadata } from "next";
import Header from "../../components/Header";
import SiteFooter from "../../components/SiteFooter";
import RegisterView from "../../components/account/RegisterView";

export const metadata: Metadata = {
  title: "Register | Chamaro",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <div className="site-shell">
      <Header />

      <div className="page-title-band">
        <h1>Register</h1>
      </div>

      <main className="account-page">
        <RegisterView />
      </main>

      <SiteFooter />
    </div>
  );
}
