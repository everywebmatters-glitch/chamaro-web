"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Product } from "../lib/products";
import Modal from "./Modal";

/* Horizontal swipe distance (px) that changes the image */
const SWIPE_PX = 40;
/* Magnification in the zoom viewer */
const ZOOM = 2.5;

export default function ProductGallery({
  images,
  badge,
}: {
  images: Product["images"];
  /* Short label pinned to the image's top-left corner, e.g. "Free Delivery" */
  badge?: string;
}) {
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const swipeStart = useRef<number | null>(null);
  const hasMany = images.length > 1;

  const go = (step: number) =>
    setActive((current) => (current + step + images.length) % images.length);

  return (
    <div className="product-gallery">
      <div
        className="product-gallery-main"
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse") swipeStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (swipeStart.current === null || !hasMany) return;
          const distance = event.clientX - swipeStart.current;
          swipeStart.current = null;
          if (Math.abs(distance) >= SWIPE_PX) go(distance < 0 ? 1 : -1);
        }}
        onPointerCancel={() => (swipeStart.current = null)}
      >
        <Image
          src={images[active].src}
          alt={images[active].alt}
          fill
          priority
          sizes="(max-width: 1000px) 100vw, 50vw"
          className="product-gallery-image"
        />

        {badge && <span className="product-gallery-badge">{badge}</span>}

        <button
          type="button"
          className="product-gallery-zoom"
          onClick={() => setViewerOpen(true)}
          aria-label="Zoom image"
        >
          <Expand size={18} strokeWidth={1.8} />
        </button>
      </div>

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

      <Modal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title="Product image viewer"
        className="gallery-viewer"
      >
        {viewerOpen && (
          <ZoomViewer images={images} active={active} onChange={setActive} />
        )}
      </Modal>
    </div>
  );
}

/* Full-screen image with click/tap to zoom; the zoomed image follows the pointer */
function ZoomViewer({
  images,
  active,
  onChange,
}: {
  images: Product["images"];
  active: number;
  onChange: (index: number) => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const hasMany = images.length > 1;

  const go = (step: number) => {
    setZoomed(false);
    onChange((active + step + images.length) % images.length);
  };

  /* Arrow keys page through the images while the viewer is open */
  useEffect(() => {
    if (!hasMany) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const follow = (event: React.MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    setOrigin(`${Math.min(100, Math.max(0, x))}% ${Math.min(100, Math.max(0, y))}%`);
  };

  return (
    <div className="gallery-viewer-inner">
      <button
        type="button"
        className={`gallery-viewer-stage${zoomed ? " zoomed" : ""}`}
        onClick={(event) => {
          follow(event);
          setZoomed((value) => !value);
        }}
        onPointerMove={(event) => zoomed && follow(event)}
        aria-label={zoomed ? "Zoom out" : "Zoom in"}
      >
        <Image
          src={images[active].src}
          alt={images[active].alt}
          fill
          sizes="100vw"
          className="gallery-viewer-image"
          style={{ transform: zoomed ? `scale(${ZOOM})` : undefined, transformOrigin: origin }}
        />
      </button>

      {hasMany && (
        <>
          <button
            type="button"
            className="gallery-viewer-arrow gallery-viewer-prev"
            onClick={() => go(-1)}
            aria-label="Previous image"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="gallery-viewer-arrow gallery-viewer-next"
            onClick={() => go(1)}
            aria-label="Next image"
          >
            <ChevronRight size={22} />
          </button>
          <p className="gallery-viewer-count" aria-live="polite">
            {active + 1} / {images.length}
          </p>
        </>
      )}
    </div>
  );
}
