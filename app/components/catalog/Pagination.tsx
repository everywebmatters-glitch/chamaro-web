import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* Page numbers with ellipses: 1 2 3 … 23 */
function pageItems(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const items = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => items.add(page));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((page) => items.add(page));

  const sorted = [...items].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

export default function Pagination({
  current,
  total,
  hrefFor,
}: {
  current: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  /* Always rendered so shoppers see where they are, even on a single page */
  return (
    <nav className="pagination" aria-label="Pagination">
      {current > 1 && (
        <Link href={hrefFor(current - 1)} aria-label="Previous page">
          <ChevronLeft size={18} />
        </Link>
      )}

      {pageItems(current, total).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="pagination-gap" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            className={item === current ? "selected" : ""}
            aria-current={item === current ? "page" : undefined}
            aria-label={`Page ${item}`}
          >
            {item}
          </Link>
        )
      )}

      {current < total ? (
        <Link href={hrefFor(current + 1)} aria-label="Next page">
          <ChevronRight size={18} />
        </Link>
      ) : (
        <span className="pagination-disabled" aria-disabled="true" aria-label="No next page">
          <ChevronRight size={18} />
        </span>
      )}
    </nav>
  );
}
