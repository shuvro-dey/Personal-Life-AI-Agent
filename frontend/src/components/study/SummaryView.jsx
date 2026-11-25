import React, { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "../common/Button";
import { useToast } from "../common/Toast";
import { useI18n } from "../../context/I18nContext";

export function SummaryView({ summary, onGenerate, loading = false }) {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    addToast("Summary copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!summary) {
    return (
      <div className="p-8 text-center bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          No summary generated yet
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Generate an objective, structured summary of the material.
        </p>
        <div className="mt-4">
          <Button
            variant="primary"
            size="sm"
            onClick={onGenerate}
            loading={loading}
            loadingText={t("common.working")}
          >
            {t("study.generateSummary")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-edge-light dark:border-edge-dark">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs">
          {t("study.tabSummary")}
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-element border border-edge-light dark:border-edge-dark hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-element border border-edge-light dark:border-edge-dark hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-2 font-normal">
        {summary}
      </div>
    </div>
  );
}
