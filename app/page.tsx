import Header from "./components/Header";
import { getNavCategories } from "./lib/catalog-api";
import HeroBanner from "./components/HeroBanner";
import ChairShowcase from "./components/ChairShowcase";
import BestSellers from "./components/BestSellers";
import DesignedToElevate from "./components/DesignedToElevate";
import ServiceHighlights from "./components/ServiceHighlights";
import SiteFooter from "./components/SiteFooter";

export default async function Home() {
  const categories = await getNavCategories();

  return (
    <div className="site-shell">
      <Header overlay />

      <main>
        <HeroBanner />

        <ChairShowcase categories={categories} />

        <BestSellers />

        <DesignedToElevate />

        <ServiceHighlights />
      </main>

      <SiteFooter />
    </div>
  );
}