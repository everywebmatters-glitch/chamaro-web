"use client";

export default function ReloadButton() {
  return (
    <button type="button" className="see-more-button" onClick={() => window.location.reload()}>
      Try again
    </button>
  );
}
