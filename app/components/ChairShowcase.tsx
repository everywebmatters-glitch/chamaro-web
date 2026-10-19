"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { categoryHref, categoryIcon, withIconCategories, type NavCategory } from "../lib/catalog-nav";

/* =========================================================
   CATEGORY SHOWCASE
   A nav strip of the live categories from the API (nothing is
   invented here). A category without a dedicated icon in
   public/icons gets a generic chair icon.
   Scrolls by touch swipe / drag / trackpad, by mouse wheel
   (vertical wheel input is redirected to horizontal scroll),
   or via the arrow buttons. Icons beyond the row's edge stay
   clipped until scrolled into view.
========================================================= */

export default function ChairShowcase({ categories: apiCategories }: { categories: NavCategory[] }) {
  const categories = withIconCategories(apiCategories);
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Arrows only show when there is somewhere to scroll to
    const update = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      setCanScroll({ left: track.scrollLeft > 1, right: track.scrollLeft < maxScroll - 1 });
    };

    // Redirect vertical wheel input to horizontal scroll. Registered natively
    // because React's onWheel is passive and cannot preventDefault. Page scroll
    // is left alone when the row can't move further in that direction.
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const atEdge =
        (event.deltaY < 0 && track.scrollLeft <= 0) ||
        (event.deltaY > 0 && track.scrollLeft >= maxScroll - 1);
      if (maxScroll <= 0 || atEdge) return;
      track.scrollLeft += event.deltaY;
      event.preventDefault();
    };

    update();
    track.addEventListener("scroll", update, { passive: true });
    track.addEventListener("wheel", onWheel, { passive: false });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", update);
      track.removeEventListener("wheel", onWheel);
      observer.disconnect();
    };
  }, [categories.length]);

  const scrollByAmount = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  if (categories.length === 0) return null;

  return (
    <section className="chair-showcase" aria-labelledby="chair-showcase-title">
      <div className="chair-showcase-header">
        <h2 id="chair-showcase-title">Find Your Style</h2>
      </div>

      <div className="category-circles-wrap">
        {canScroll.left && (
          <button
            type="button"
            className="category-scroll-arrow category-scroll-arrow-left"
            onClick={() => scrollByAmount(-1)}
            aria-label="Scroll categories left"
          >
            <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}

        <ul className="category-circles" ref={trackRef}>
          {categories.map((category) => (
            <li key={category.slug}>
              <Link href={categoryHref(category.slug)} className="category-circle">
                <span className="category-circle-art">
                  <Image src={categoryIcon(category.slug)} alt="" width={44} height={44} />
                </span>
                <span className="category-circle-name">{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        {canScroll.right && (
          <button
            type="button"
            className="category-scroll-arrow category-scroll-arrow-right"
            onClick={() => scrollByAmount(1)}
            aria-label="Scroll categories right"
          >
            <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
