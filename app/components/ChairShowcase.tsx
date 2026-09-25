import Image from "next/image";
import Link from "next/link";

/* =========================================================
   CATEGORY SHOWCASE
   A presentational nav strip — separate from the product
   catalogue's category list, so it can lead with categories
   (Premium, Bar Stool, ...) that don't have catalogue data
   yet. One entry per icon in public/icons.
   Scrolls sideways by hand only (touch swipe / drag /
   trackpad) — no arrow buttons, no auto-scroll. Icons beyond
   the row's edge stay clipped until scrolled into view.
========================================================= */

const categories = [
  { name: "Boss", slug: "boss", icon: "/icons/boss-chair.svg" },
  { name: "Cafe", slug: "cafe", icon: "/icons/cafe-chair.svg" },
  { name: "Executive", slug: "executive", icon: "/icons/executive-chair.svg" },
  { name: "Premium", slug: "premium", icon: "/icons/premium-chair.svg" },
  { name: "Bar Stool", slug: "bar-stool", icon: "/icons/bar-stool.svg" },
  { name: "Visitor", slug: "visitor", icon: "/icons/visitor-chair.svg" },
  { name: "Waiting Chairs", slug: "waiting-chairs", icon: "/icons/waiting-chairs.svg" },
  { name: "Workstation", slug: "workstation", icon: "/icons/workstation.svg" },
];

export default function ChairShowcase() {
  return (
    <section className="chair-showcase" aria-labelledby="chair-showcase-title">
      <div className="chair-showcase-header">
        <h2 id="chair-showcase-title">Find Your Perfect Chair</h2>
      </div>

      <ul className="category-circles">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link href={`/products?category=${category.slug}`} className="category-circle">
              <span className="category-circle-art">
                <Image src={category.icon} alt="" width={42} height={42} />
              </span>
              <span className="category-circle-name">{category.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
