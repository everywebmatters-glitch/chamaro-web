import type { Metadata } from "next";
import Header from "../../../components/Header";
import SiteFooter from "../../../components/SiteFooter";
import GoogleCallbackView from "../../../components/account/GoogleCallbackView";

export const metadata: Metadata = {
  title: "Signing in | Chamaro",
  robots: { index: false },
  /* Never leak this URL to other sites */
  referrer: "no-referrer",
};

export default function GoogleCallbackPage() {
  return (
    <div className="site-shell">
      <Header />

      <div className="page-title-band">
        <h1>Log in</h1>
      </div>

      <main className="account-page">
        <GoogleCallbackView />
      </main>

      <SiteFooter />
    </div>
  );
}
