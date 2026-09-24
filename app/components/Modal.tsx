"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/* Accessible modal built on the native <dialog> element */
export default function Modal({
  open,
  onClose,
  title,
  className = "",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${className}`}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        /* Close when the backdrop (the dialog itself) is clicked */
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="modal-body">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <X size={22} strokeWidth={1.8} />
        </button>

        {children}
      </div>
    </dialog>
  );
}
