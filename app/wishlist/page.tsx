import type { Metadata } from "next";
import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";
import WishlistView from "../components/WishlistView";

export const metadata: Metadata = {
  title: "Wishlist | Chamaro",
  robots: { index: false },
};

export default function WishlistPage() {
  return (
    <div className="site-shell">
      <Header />

      <main className="wishlist-page">
        <WishlistView />
      </main>

      <SiteFooter />
    </div>
  );
}
