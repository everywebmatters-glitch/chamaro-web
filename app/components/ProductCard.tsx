import Image from "next/image";
import Link from "next/link";
import { formatPrice, getCategoryName, type Product } from "../lib/products";
import ProductCardActions from "./ProductCardActions";

export function StarRating({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  return (
    <div className="product-rating" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < rating ? "" : "star-empty"} aria-hidden="true">
          ★
        </span>
      ))}
      <small>({reviewCount})</small>
    </div>
  );
}

export function PriceRow({ product, className = "" }: { product: Product; className?: string }) {
  return (
    <div className={`product-price-row ${className}`}>
      <span className="price-current">{formatPrice(product.price)}</span>

      {product.compareAtPrice && (
        <s className="price-original">{formatPrice(product.compareAtPrice)}</s>
      )}
    </div>
  );
}

export default function ProductCard({
  product,
  compact = false,
  layout = "grid",
}: {
  product: Product;
  /* Compact cards (search overlay) drop the hover actions */
  compact?: boolean;
  layout?: "grid" | "list";
}) {
  const href = `/products/${product.slug}`;

  return (
    <article className={`product-card product-card-${layout}`}>
      <div className="product-card-media">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          <Image
            src={product.images[0].src}
            alt=""
            fill
            sizes="(max-width: 760px) 50vw, (max-width: 1000px) 33vw, 25vw"
            className="product-card-image"
          />

          {product.images[1] && (
            <Image
              src={product.images[1].src}
              alt=""
              fill
              sizes="(max-width: 760px) 50vw, (max-width: 1000px) 33vw, 25vw"
              className="product-card-image product-card-image-alt"
            />
          )}
        </Link>

        {!compact && <ProductCardActions product={product} />}
      </div>

      <div className="product-meta">
        {layout === "list" && (
          <p className="product-category">{product.categoryName ?? getCategoryName(product.category)}</p>
        )}

        <StarRating rating={product.rating} reviewCount={product.reviewCount} />

        <h3>
          <Link href={href}>{product.name}</Link>
        </h3>

        <PriceRow product={product} />

        {layout === "list" && (
          <p className="product-card-description">{product.shortDescription}</p>
        )}

        <ul className="product-card-colors" aria-label="Available colours">
          {product.colors.map((color) => (
            <li key={color.name} title={color.name} style={{ background: color.hex }}>
              <span className="sr-only">{color.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
