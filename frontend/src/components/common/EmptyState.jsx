import React from "react";
import { Button } from "./Button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-card border border-dashed border-edge-light dark:border-edge-dark bg-slate-50/50 dark:bg-surface-dark/50 my-4">
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-3">
          <Icon className="w-5 h-5 stroke-[1.5]" />
        </div>
      )}
      <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">
        {title}
      </h4>
      {description && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
