"use client";

/* The 404's secondary action. Split into its own client island so
   app/not-found.tsx can stay a server component and keep exporting metadata. */
export default function TryAgainButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => location.reload()}>
      <span className="mas">Try again</span>
      <span className="face" aria-hidden="true">Try again</span>
    </button>
  );
}
