import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[1px]"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`relative w-full ${maxWidth} bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card shadow-lg z-10 overflow-hidden`}
          >
            <div className="flex items-start justify-between p-4 border-b border-edge-light dark:border-edge-dark">
              <div>
                {title && (
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-element transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
