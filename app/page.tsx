import Header from "./components/Header";
import { getCollectionFeature, getHeroBanners, getNavCategories } from "./lib/catalog-api";
import HeroBanner from "./components/HeroBanner";
import ChairShowcase from "./components/ChairShowcase";
import BestSellers from "./components/BestSellers";
import DesignedToElevate from "./components/DesignedToElevate";
import ServiceHighlights from "./components/ServiceHighlights";
import SiteFooter from "./components/SiteFooter";

export default async function Home() {
  const [categories, banners, collection] = await Promise.all([getNavCategories(), getHeroBanners(), getCollectionFeature()]);

  return (
    <div className="site-shell">
      <Header overlay />

      <main>
        <HeroBanner banners={banners} />

        <ChairShowcase categories={categories} />

        <BestSellers />

        <DesignedToElevate feature={collection} />

        <ServiceHighlights />
      </main>

      <SiteFooter />
    </div>
  );
}