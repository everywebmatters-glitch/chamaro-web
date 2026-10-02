import type { Metadata } from "next";
import { Suspense } from "react";
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

      <main className="account-page">
        <Suspense fallback={null}>
          <RegisterView />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
