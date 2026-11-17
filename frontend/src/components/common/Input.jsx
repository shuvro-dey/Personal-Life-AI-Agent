import React, { forwardRef } from "react";

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    type = "text",
    className = "",
    id,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`w-full h-9 px-3 text-sm bg-surface-light dark:bg-surface-dark border rounded-element transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${
          error
            ? "border-status-danger focus:ring-status-danger focus:border-status-danger"
            : "border-edge-light dark:border-edge-dark hover:border-slate-400 dark:hover:border-slate-600"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-status-danger">{error}</p>
      )}
      {!error && helperText && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
});
