"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroBannerSlide } from "../lib/hero-banners";

/* =========================================================
   HERO SLIDES
   Each slide carries its own tint so the page top, the
   circle and the accent triangles change together. A
   fullBleed slide skips the circle cutout entirely: its
   artwork already carries its own negative space for the
   copy, so `circle`/`accent`/`imageScale` are unused.
========================================================= */

type Slide = {
  title: [string, string];
  subtitle: [string, string];
  image: string;
  alt: string;
  href: string;
  background: string;
  circle?: string;
  accent?: string;
  imageScale?: number;
  fullBleed?: boolean;
};

/* Shown when the API has no active banners (or can't be reached) */
const FALLBACK_SLIDES: Slide[] = [
  {
    title: ["Engineered", "to Lead"],
    subtitle: [
      "Premium seating designed for professionals",
      "who value comfort, refined style, and lasting quality.",
    ],
    /* Full-bleed banner: no circle cutout, the artwork carries its own negative space */
    image: "/hero/executive-trio.svg",
    alt: "Three executive chairs in tan leatherette, front and side views",
    href: "/products",
    background: "#ffffff",
    fullBleed: true,
  },
];

/* =========================================================
   SCROLLING ANNOUNCEMENT STRIP
========================================================= */

const scrollingText = [
  "Premium office furniture",
  "Ergonomic comfort",
  "1 year warranty",
  "Modern designs",
  "Bulk orders welcome",
  "Made for every workspace",
];

const AUTOPLAY_MS = 6000;

/* Banners from the CMS only change the content: the admin's image fills the hero, and the heading and sub heading
   sit in the same fixed place as the built-in slide, above the fixed "Shop collection" button. */
type DisplaySlide =
  | { kind: "static"; slide: Slide; key: string; label: string }
  | { kind: "banner"; banner: HeroBannerSlide; key: string; label: string };

export default function HeroBanner({ banners = [] }: { banners?: HeroBannerSlide[] }) {
  const slides: DisplaySlide[] = banners.length
    ? banners.map((banner) => ({ kind: "banner", banner, key: banner.id, label: banner.title }))
    : FALLBACK_SLIDES.map((slide) => ({ kind: "static", slide, key: slide.image, label: slide.title.join(" ") }));
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);
  /* The slide list can change between renders (a refresh may bring different banners) */
  const shown = Math.min(current, slides.length - 1);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  /* Autoplay — paused on hover/focus and for reduced-motion users; a single slide has nothing to advance to */
  useEffect(() => {
    if (paused || reducedMotion.current || slides.length < 2) return;
    const timer = setTimeout(() => setCurrent((index) => (index + 1) % slides.length), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [current, paused, slides.length]);

  const goTo = useCallback((index: number) => setCurrent(index), []);
  const first = slides[shown];

  return (
    <>
      <section
        className="hero"
        aria-roledescription="carousel"
        aria-label="Featured collections"
        style={{ "--hero-bg": first.kind === "static" ? first.slide.background : "#ffffff" } as React.CSSProperties}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {slides.map((item, index) => {
          const active = index === shown;
          const Title = index === 0 ? "h1" : "h2";
          const label = `${index + 1} of ${slides.length}`;

          if (item.kind === "banner") {
            const { banner } = item;
            return (
              <div
                key={item.key}
                className={`hero-slide hero-slide-api${active ? " active" : ""}`}
                role="group"
                aria-roledescription="slide"
                aria-label={label}
                aria-hidden={!active}
                inert={!active}
              >
                <div className="hero-banner-image">
                  <Image
                    src={banner.image}
                    alt={banner.alt}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className={banner.mobileImage ? "hero-img-desktop" : undefined}
                  />
                  {banner.mobileImage && (
                    <Image src={banner.mobileImage} alt={banner.alt} fill sizes="100vw" className="hero-img-mobile" />
                  )}
                </div>
                <div className="hero-copy">
                  <Title className="hero-title">{banner.title}</Title>
                  {banner.subtitle && <p className="hero-subtitle">{banner.subtitle}</p>}
                  <Link href={banner.href ?? "/products"} className="hero-cta">
                    Shop collection
                    <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          }

          const slide = item.slide;
          return (
            <div
              key={item.key}
              className={`hero-slide${slide.fullBleed ? " hero-slide-banner" : ""}${active ? " active" : ""}`}
              role="group"
              aria-roledescription="slide"
              aria-label={label}
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

                <p className="hero-subtitle">
                  {slide.subtitle[0]}
                  <br />
                  {slide.subtitle[1]}
                </p>

                <Link href={slide.href} className="hero-cta">
                  Shop collection
                  <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
                </Link>
              </div>

              {slide.fullBleed && (
                <div className="hero-banner-image" aria-hidden={!active}>
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                  />
                </div>
              )}

              {!slide.fullBleed && (
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
              )}
            </div>
          );
        })}

        {slides.length > 1 && (
          <div className="hero-dots" role="group" aria-label="Choose slide">
            {slides.map((item, index) => (
              <button
                key={item.key}
                type="button"
                className={index === shown ? "selected" : ""}
                onClick={() => goTo(index)}
                aria-label={`Show slide ${index + 1}: ${item.label}`}
                aria-current={index === shown ? "true" : undefined}
              />
            ))}
          </div>
        )}
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
                  <span className="value-dot" aria-hidden="true">•</span>
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
