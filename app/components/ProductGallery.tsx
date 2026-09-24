"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Product } from "../lib/products";

export default function ProductGallery({ images }: { images: Product["images"] }) {
  const [active, setActive] = useState(0);
  const hasMany = images.length > 1;

  const go = (step: number) =>
    setActive((current) => (current + step + images.length) % images.length);

  return (
    <div className={`product-gallery${hasMany ? " has-thumbs" : ""}`}>
      {hasMany && (
        <div className="product-gallery-thumbs" aria-label="Product images">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              className={index === active ? "selected" : ""}
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-pressed={index === active}
            >
              <Image src={image.src} alt="" fill sizes="120px" />
            </button>
          ))}
        </div>
      )}

      <div className="product-gallery-main">
        <Image
          src={images[active].src}
          alt={images[active].alt}
          fill
          priority
          sizes="(max-width: 1000px) 100vw, 50vw"
          className="product-gallery-image"
        />

        {hasMany && (
          <>
            <button
              type="button"
              className="gallery-arrow gallery-arrow-prev"
              onClick={() => go(-1)}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="gallery-arrow gallery-arrow-next"
              onClick={() => go(1)}
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
