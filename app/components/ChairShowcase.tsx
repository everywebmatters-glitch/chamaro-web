"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

/* =========================================================
   CATEGORY SHOWCASE
   A presentational nav strip — separate from the product
   catalogue's category list, so it can lead with categories
   (Premium, Bar Stool, ...) that don't have catalogue data
   yet. One entry per icon in public/icons.
   Scrolls by touch swipe / drag / trackpad, by mouse wheel
   (vertical wheel input is redirected to horizontal scroll),
   or via the arrow buttons. Icons beyond the row's edge stay
   clipped until scrolled into view.
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
  const trackRef = useRef<HTMLUListElement>(null);

  const scrollByAmount = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="chair-showcase" aria-labelledby="chair-showcase-title">
      <div className="chair-showcase-header">
        <h2 id="chair-showcase-title">Find Your Style</h2>
      </div>

      <div className="category-circles-wrap">
        <button
          type="button"
          className="category-scroll-arrow category-scroll-arrow-left"
          onClick={() => scrollByAmount(-1)}
          aria-label="Scroll categories left"
        >
          <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>

        <ul

          className="category-circles"
          ref={trackRef}
          onWheel={(event) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            event.currentTarget.scrollLeft += event.deltaY;
            event.preventDefault();
          }}
        >
          {categories.map((category) => (
            <li key={category.slug}>
              <Link href={`/products?category=${category.slug}`} className="category-circle">
                <span className="category-circle-art">
                  <Image src={category.icon} alt="" width={44} height={44} />
                </span>
                <span className="category-circle-name">{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="category-scroll-arrow category-scroll-arrow-right"
          onClick={() => scrollByAmount(1)}
          aria-label="Scroll categories right"
        >
          <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
