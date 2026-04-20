"use client";

export default function JourneySkeleton() {
  return (
    <div className="flex flex-col xl:flex-row flex-1 min-h-0 rounded-b-2xl animate-pulse">
      {/* Details skeleton */}
      <div
        className="flex-shrink-0 xl:w-96 xl:flex-shrink-0 overflow-hidden p-5 flex flex-col gap-4"
        style={{ backgroundColor: "var(--surface)" }}
      >
        {/* Ferry leg skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "var(--surface-variant)" }} />
          <div className="h-4 rounded w-48" style={{ backgroundColor: "var(--surface-variant)" }} />
        </div>
        <div className="pl-7 flex flex-col gap-2">
          <div className="h-8 rounded-lg w-32" style={{ backgroundColor: "var(--surface-variant)" }} />
          <div className="h-3 rounded w-24" style={{ backgroundColor: "var(--surface-variant)" }} />
        </div>
        {/* Drive leg skeleton */}
        <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: "var(--surface-variant)" }} />
          <div className="h-4 rounded w-36" style={{ backgroundColor: "var(--surface-variant)" }} />
          <div className="ml-auto h-4 rounded w-12" style={{ backgroundColor: "var(--surface-variant)" }} />
        </div>
        {/* Another ferry leg */}
        <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "var(--surface-variant)" }} />
          <div className="h-4 rounded w-44" style={{ backgroundColor: "var(--surface-variant)" }} />
        </div>
        <div className="pl-7 flex flex-col gap-2">
          <div className="h-8 rounded-lg w-28" style={{ backgroundColor: "var(--surface-variant)" }} />
          <div className="h-3 rounded w-20" style={{ backgroundColor: "var(--surface-variant)" }} />
        </div>
        {/* Arrival footer skeleton */}
        <div className="mt-auto pt-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="h-4 rounded w-20" style={{ backgroundColor: "var(--surface-variant)" }} />
          <div className="h-4 rounded w-12" style={{ backgroundColor: "var(--surface-variant)" }} />
        </div>
      </div>
      {/* Map skeleton */}
      <div className="flex-1 min-h-[200px]" style={{ backgroundColor: "var(--surface-variant)" }} />
    </div>
  );
}
