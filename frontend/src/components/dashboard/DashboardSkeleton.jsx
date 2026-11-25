import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-edge-light dark:border-edge-dark">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-element" />
          <div className="h-9 w-14 bg-slate-200 dark:bg-slate-800 rounded-element" />
          <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-element" />
          <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-element" />
        </div>
      </div>

      {/* Hero Assistant Skeleton */}
      <div className="h-56 rounded-card-lg bg-slate-200 dark:bg-slate-800" />

      {/* 4 Metrics Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-card bg-slate-200 dark:bg-slate-800 p-4 space-y-3">
            <div className="w-8 h-8 rounded-element bg-slate-300 dark:bg-slate-700" />
            <div className="h-6 w-16 bg-slate-300 dark:bg-slate-700 rounded" />
            <div className="h-3 w-28 bg-slate-300 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* 2 Activity Columns Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 rounded-card bg-slate-200 dark:bg-slate-800" />
        <div className="h-72 rounded-card bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Bottom Modules Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-60 rounded-card bg-slate-200 dark:bg-slate-800" />
        <div className="h-60 rounded-card bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
