"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CollectionFeature } from "../lib/collection-feature";

const AUTOPLAY_MS = 3500;

export default function DesignedToElevate({ feature }: { feature: CollectionFeature }) {
  const mediaImages = feature.images;
  const [current, setCurrent] = useState(0);
  const shown = Math.min(current, mediaImages.length - 1);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || mediaImages.length < 2) return;
    const timer = setTimeout(
      () => setCurrent((index) => (index + 1) % mediaImages.length),
      AUTOPLAY_MS
    );
    return () => clearTimeout(timer);
  }, [current, mediaImages.length]);

  return (
    <section className="elevate" aria-labelledby="elevate-title">
      <div className="elevate-card">
        <div className="elevate-copy">
          <h2 id="elevate-title">{feature.heading}</h2>

          <p>{feature.text}</p>

          <Link className="elevate-link" href={feature.buttonHref}>
            {feature.buttonLabel}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="elevate-media">
          <div
            className="elevate-media-track"
            style={{ transform: `translateX(-${shown * 100}%)` }}
          >
            {mediaImages.map((image, index) => (
              <div className="elevate-media-slide" key={`${image.src}-${index}`}>
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
