"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/* =========================================================
   HERO SLIDES
   Each slide carries its own tint so the page top, the
   circle and the accent triangles change together.
========================================================= */

const slides = [
  {
    title: ["Engineered", "to Lead"],
    subtitle: "Boss chairs built for long, focused workdays",
    image: "/hero/boss-green.webp",
    alt: "Wing Way Boss Chair in forest green leatherette",
    href: "/products?category=boss",
    background: "#eef2ef",
    circle: "#dfe9e2",
    accent: "#cddfd3",
    imageScale: 1,
  },
  {
    title: ["Designed", "for Comfort"],
    subtitle: "Executive seating with generous, all-day cushioning",
    image: "/hero/executive-tan.webp",
    alt: "Regent Executive Chair in tan leatherette with diamond stitching",
    href: "/products?category=executive",
    background: "#f8f2ec",
    circle: "#f2e2d4",
    accent: "#ecd9c4",
    imageScale: 0.82,
  },
  {
    title: ["Work with", "Confidence"],
    subtitle: "Premium office furniture for every workspace",
    image: "/hero/boss-green-back.webp",
    alt: "Wing Way Boss Chair, rear view showing the chrome five-star base",
    href: "/products",
    background: "#eff1f6",
    circle: "#dfe4f1",
    accent: "#d3daf0",
    imageScale: 0.92,
  },
];

/* =========================================================
   SCROLLING ANNOUNCEMENT STRIP
========================================================= */

const scrollingText = [
  "Premium office furniture",
  "Ergonomic comfort, all day",
  "1-year warranty on every chair",
  "Bulk orders welcome",
  "Made for every workspace",
];

const AUTOPLAY_MS = 6000;

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  /* Autoplay — paused on hover/focus and for reduced-motion users */
  useEffect(() => {
    if (paused || reducedMotion.current) return;
    const timer = setTimeout(
      () => setCurrent((index) => (index + 1) % slides.length),
      AUTOPLAY_MS
    );
    return () => clearTimeout(timer);
  }, [current, paused]);

  const goTo = useCallback((index: number) => setCurrent(index), []);

  return (
    <>
      <section
        className="hero"
        aria-roledescription="carousel"
        aria-label="Featured collections"
        style={{ "--hero-bg": slides[current].background } as React.CSSProperties}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {slides.map((slide, index) => {
          const active = index === current;
          const Title = index === 0 ? "h1" : "h2";

          return (
            <div
              key={slide.image}
              className={`hero-slide${active ? " active" : ""}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
              aria-hidden={!active}
              inert={!active}
              style={
                {
                  "--hero-circle": slide.circle,
                  "--hero-accent": slide.accent,
                } as React.CSSProperties
              }
            >
              <div className="hero-copy">
                <Title className="hero-title">
                  {slide.title[0]}
                  <br />
                  {slide.title[1]}
                </Title>

                <p className="hero-subtitle">{slide.subtitle}</p>

                <Link href={slide.href} className="hero-cta">
                  Shop collection
                  <ChevronRight size={20} strokeWidth={2.4} aria-hidden="true" />
                </Link>
              </div>

              <div className="hero-visual" aria-hidden={!active}>
                <span className="hero-circle" />
                <span className="hero-triangle hero-triangle-a" />
                <span className="hero-triangle hero-triangle-b" />

                <div
                  className="hero-image"
                  style={{ "--image-scale": slide.imageScale } as React.CSSProperties}
                >
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 760px) 90vw, 45vw"
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div className="hero-dots" role="group" aria-label="Choose slide">
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              className={index === current ? "selected" : ""}
              onClick={() => goTo(index)}
              aria-label={`Show slide ${index + 1}: ${slide.title.join(" ")}`}
              aria-current={index === current ? "true" : undefined}
            />
          ))}
        </div>
      </section>

      {/* =====================================================
          SCROLLING ANNOUNCEMENT STRIP
          Two copies of the list make the loop seamless.
      ===================================================== */}

      <div className="value-bar">
        <div className="value-track">
          {[0, 1].map((copy) => (
            <div className="value-group" key={copy} aria-hidden={copy === 1 || undefined}>
              {scrollingText.map((text) => (
                <span key={text}>
                  <Zap size={26} strokeWidth={0} fill="currentColor" aria-hidden="true" />
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
