"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const mediaImages = [
  { src: "/elevate-chair.webp", alt: "Grey upholstered Chamaro cafe chair with black and brass legs" },
  { src: "/hero/boss-green.webp", alt: "Chamaro boss chair in green upholstery" },
  { src: "/hero/executive-tan.webp", alt: "Chamaro executive chair in tan leatherette" },
  { src: "/hero/cafe-grey.webp", alt: "Chamaro cafe chair in grey upholstery" },
];

const AUTOPLAY_MS = 3500;

export default function DesignedToElevate() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    const timer = setTimeout(
      () => setCurrent((index) => (index + 1) % mediaImages.length),
      AUTOPLAY_MS
    );
    return () => clearTimeout(timer);
  }, [current]);

  return (
    <section className="elevate" aria-labelledby="elevate-title">
      <div className="elevate-card">
        <div className="elevate-copy">
          <h2 id="elevate-title">
            A Collection Made
            <br />
            for Comfort
          </h2>

          <p>
            Discover thoughtfully designed seating that brings together
            comfort, quality, and contemporary design across every Chamaro
            collection.
          </p>

          <Link className="elevate-link" href="/products">
            Explore Collection
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="elevate-media">
          <div
            className="elevate-media-track"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {mediaImages.map((image, index) => (
              <div className="elevate-media-slide" key={image.src}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 760px) 100vw, 45vw"
                  className="elevate-image"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
