"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { sortOptions, type SortOption } from "../lib/products";

export default function SortSelect({
  value,
  hrefFor,
}: {
  value: SortOption;
  hrefFor: (sort: SortOption) => string;
}) {
  const router = useRouter();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(hrefFor(event.target.value as SortOption), { scroll: false });
  };

  return (
    <label className="sort-select">
      <span className="sr-only">Sort products</span>
      <select value={value} onChange={handleChange}>
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
    </label>
  );
}
