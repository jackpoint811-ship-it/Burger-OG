import React from "react";

export function SkeletonLoader() {
  return (
    <div
      className="min-h-screen bg-[#F5F2EE] px-4 py-6 text-neutral-800"
      aria-busy="true"
      aria-label="Cargando menú de Burgers.exe..."
    >
      <div className="mx-auto max-w-[768px] space-y-6">
        {/* Header Branding Skeleton */}
        <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-neutral-200/80 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-200" />
            <div className="space-y-1">
              <div className="h-4 w-32 rounded bg-neutral-200" />
              <div className="h-3 w-20 rounded bg-neutral-200" />
            </div>
          </div>
          <div className="h-8 w-24 rounded-full bg-neutral-200" />
        </div>

        {/* Hero Banner Skeleton */}
        <div className="h-44 w-full rounded-3xl bg-white p-6 shadow-sm border border-neutral-200/80 animate-pulse flex flex-col justify-end space-y-2">
          <div className="h-6 w-2/3 rounded bg-neutral-200" />
          <div className="h-4 w-1/2 rounded bg-neutral-200" />
        </div>

        {/* Category Pills Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-9 w-24 flex-shrink-0 rounded-full bg-white border border-neutral-200"
            />
          ))}
        </div>

        {/* Grid of Product Cards Skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-2xl bg-white p-3 shadow-sm border border-neutral-200 animate-pulse space-y-3"
            >
              {/* Product Image Box */}
              <div className="h-32 w-full rounded-xl bg-neutral-200" />

              {/* Text lines */}
              <div className="space-y-2">
                <div className="h-4 w-4/5 rounded bg-neutral-200" />
                <div className="h-3 w-3/5 rounded bg-neutral-200" />
              </div>

              {/* Price & Add Button */}
              <div className="flex items-center justify-between pt-1">
                <div className="h-4 w-12 rounded bg-neutral-200" />
                <div className="h-8 w-8 rounded-full bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
