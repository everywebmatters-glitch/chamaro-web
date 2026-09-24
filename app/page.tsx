import Header from "./components/Header";
import HeroBanner from "./components/HeroBanner";
import ChairShowcase from "./components/ChairShowcase";
import BestSellers from "./components/BestSellers";
import DesignedToElevate from "./components/DesignedToElevate";
import ServiceHighlights from "./components/ServiceHighlights";
import SiteFooter from "./components/SiteFooter";

export default function Home() {
  return (
    <div className="site-shell">
      <Header overlay />

      <main>
        <HeroBanner />

        <ChairShowcase />

        <BestSellers />

        <DesignedToElevate />

        <ServiceHighlights />
      </main>

      <SiteFooter />
    </div>
  );
}