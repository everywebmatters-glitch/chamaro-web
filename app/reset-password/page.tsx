import type { Metadata } from "next";
import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";
import ResetPasswordView from "../components/account/ResetPasswordView";

/* The backend emails links to /reset-password#token=... (APP_BASE_URL + "/reset-password") */
export const metadata: Metadata = {
  title: "Reset password | Chamaro",
  robots: { index: false },
  /* Never leak this URL to other sites */
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return (
    <div className="site-shell">
      <Header />

      <div className="page-title-band">
        <h1>Reset password</h1>
      </div>

      <main className="account-page">
        <ResetPasswordView />
      </main>

      <SiteFooter />
    </div>
  );
}
