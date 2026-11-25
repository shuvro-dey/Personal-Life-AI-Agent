import React from "react";
import { Loader2 } from "lucide-react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-element focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 h-8 gap-1.5",
    md: "text-sm px-3.5 py-2 h-9 gap-2",
    lg: "text-base px-4 py-2.5 h-11 gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-none border border-transparent",
    secondary:
      "bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
    ghost:
      "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
    danger:
      "bg-status-danger hover:bg-red-800 active:bg-red-900 text-white border border-transparent",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{loadingText || "Working on it"}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
