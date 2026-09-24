import Image from "next/image";

export default function DesignedToElevate() {
  return (
    <section className="elevate" aria-labelledby="elevate-title">
      <div className="elevate-card">
        <div className="elevate-copy">
          <h2 id="elevate-title">
            Designed to
            <br />
            Elevate
          </h2>

          <p>
            Thoughtfully crafted seating for professionals who value
            exceptional comfort, refined design, and lasting quality.
          </p>

          <a className="elevate-link" href="#products">
            Explore Collection
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="elevate-media">
          <Image
            src="/elevate-chair.webp"
            alt="Grey upholstered Chamaro cafe chair with black and brass legs"
            fill
            sizes="(max-width: 760px) 100vw, 45vw"
            className="elevate-image"
          />
        </div>
      </div>
    </section>
  );
}
