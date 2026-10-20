"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "../lib/api";
import { fetchProductReviews, submitReview, type ProductReviews } from "../lib/reviews-api";
import { useAuth } from "./auth/AuthProvider";

const MAX_BODY = 2000;

function Stars({ value }: { value: number }) {
  return (
    <span className="review-stars" role="img" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < Math.round(value) ? "" : "star-empty"} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

/* The Reviews tab: approved reviews, and a form for signed-in customers (their review is held for approval) */
export default function ProductReviewsPanel({ slug }: { slug: string }) {
  const { status: authStatus, token } = useAuth();
  const [data, setData] = useState<ProductReviews | null>(null);
  const [failed, setFailed] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProductReviews(slug)
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || sending) return;
    if (rating < 1) return setMessage({ tone: "error", text: "Choose a star rating." });
    if (!body.trim()) return setMessage({ tone: "error", text: "Write a few words about the product." });
    setSending(true);
    setMessage(null);
    try {
      await submitReview(token, slug, { rating, body: body.trim() });
      setRating(0);
      setBody("");
      setMessage({ tone: "ok", text: "Thank you! Your review will appear here once it has been approved." });
    } catch (error) {
      const text =
        error instanceof ApiError && error.code === "ALREADY_REVIEWED"
          ? "You have already reviewed this product."
          : error instanceof ApiError && error.status === 429
            ? "Too many reviews just now. Please try again later."
            : "Couldn't send your review. Please try again.";
      setMessage({ tone: "error", text });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="reviews">
      <div className="reviews-summary">
        {data && data.summary.count > 0 ? (
          <>
            <strong>{data.summary.average.toFixed(1)}</strong>
            <Stars value={data.summary.average} />
            <span>
              Based on {data.summary.count} review{data.summary.count === 1 ? "" : "s"}
            </span>
          </>
        ) : (
          <span>{failed ? "Reviews couldn't be loaded." : data ? "No reviews yet. Be the first to review this product." : "Loading reviews..."}</span>
        )}
      </div>

      {data && data.reviews.length > 0 && (
        <ul className="review-list">
          {data.reviews.map((review) => (
            <li key={review.id}>
              <div className="review-head">
                <Stars value={review.rating} />
                <strong>{review.authorName}</strong>
                <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</time>
              </div>
              <p>{review.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="review-form-wrap">
        <h3>Write a review</h3>
        {authStatus === "authenticated" ? (
          <form className="review-form" onSubmit={submit} noValidate>
            <div className="review-rating-input" role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  className={value <= rating ? "on" : ""}
                  onClick={() => setRating(value)}
                >
                  ★
                </button>
              ))}
            </div>
            <label htmlFor="review-body" className="sr-only">
              Your review
            </label>
            <textarea id="review-body" rows={4} maxLength={MAX_BODY} placeholder="What did you think of this product?" value={body} onChange={(event) => setBody(event.target.value)} />
            <button type="submit" className="add-to-cart" disabled={sending}>
              {sending ? "Sending..." : "Submit review"}
            </button>
            {message && (
              <p className={message.tone === "ok" ? "review-note" : "review-note review-note-error"} role="status">
                {message.text}
              </p>
            )}
          </form>
        ) : authStatus === "loading" ? null : (
          <p className="tab-lede">
            <Link href={`/account/login?redirect=${encodeURIComponent(`/products/${slug}`)}`} className="text-link">
              Sign in
            </Link>{" "}
            to write a review.
          </p>
        )}
      </div>
    </div>
  );
}
