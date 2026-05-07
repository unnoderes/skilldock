import React from "react";

export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-surface-800 border border-border ${className}`} />
  );
}

export function SkeletonRows({
  count = 3,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <LoadingSkeleton key={index} className={`h-12 w-full ${className}`} />
      ))}
    </div>
  );
}
