import type { Metadata } from "next";
import Header from "../../components/Header";
import SiteFooter from "../../components/SiteFooter";
import LoginView from "../../components/account/LoginView";

export const metadata: Metadata = {
  title: "Log in | Chamaro",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="site-shell">
      <Header />

      <main className="account-page">
        <LoginView />
      </main>

      <SiteFooter />
    </div>
  );
}
