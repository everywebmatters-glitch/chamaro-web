"use client";

import { ListFilter, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/* Slide-in filter panel; the filter links themselves are server-rendered */
export default function FilterDrawer({
  activeCount,
  children,
}: {
  activeCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* Close after a filter link changes the URL */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close on navigation
    setOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="filter-button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="filter-panel"
      >
        <ListFilter size={20} strokeWidth={2} aria-hidden="true" />
        Filter
        {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
      </button>

      <div
        className="drawer-backdrop"
        data-open={open ? "true" : "false"}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="filter-panel"
        className="filter-drawer"
        data-open={open ? "true" : "false"}
        aria-label="Filters"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="filter-drawer-header">
          <h2>Filter</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close filters">
            <X size={22} strokeWidth={1.8} />
          </button>
        </div>

        <div className="filter-drawer-body">{children}</div>
      </aside>
    </>
  );
}
