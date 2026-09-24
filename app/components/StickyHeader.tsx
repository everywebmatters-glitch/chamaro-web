"use client";

import { useEffect, useRef, useState } from "react";

/* =========================================================
   STICKY HEADER
   - Pinned to the top once the page scrolls
   - Slides away while scrolling down, returns when scrolling up
   - Gets a solid background + border once it leaves the top
========================================================= */

const HIDE_AFTER = 120; // px scrolled before hiding is allowed
const DELTA = 6; // ignore tiny scroll jitter

export default function StickyHeader({
  overlay,
  children,
}: {
  overlay: boolean;
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 8);

      if (Math.abs(y - lastY) < DELTA) return;

      /* Keep the header visible while the dropdown or a control inside it has focus */
      const hasFocus = headerRef.current?.contains(document.activeElement) ?? false;
      setHidden(y > lastY && y > HIDE_AFTER && !hasFocus);
      lastY = y;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const className = [
    "site-header",
    overlay && "site-header-overlay",
    scrolled && "is-scrolled",
    hidden && "is-hidden",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header
      ref={headerRef}
      className={className}
      id="top"
      onFocus={() => setHidden(false)}
    >
      {children}
    </header>
  );
}
