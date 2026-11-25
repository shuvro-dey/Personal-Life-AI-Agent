import React from "react";
import {
  ShoppingBag,
  BookOpen,
  ArrowRight,
  Plus,
  FileText,
  Layers,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";

export function ActiveModulesGrid({
  shoppingLists = [],
  studySessions = [],
  onNavigateTab,
}) {
  const { t, formatNumber } = useI18n();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. Shopping Lists Overview Card */}
      <div className="rounded-card bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark p-5 shadow-subtle flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-edge-light dark:border-edge-dark">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-element bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy-900 dark:text-slate-100">
                  Active Shopping Lists
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Real-time grocery & supply budgets
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab("shopping")}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4">
            {shoppingLists.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No active shopping lists.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateTab("shopping")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create new list</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {shoppingLists.slice(0, 3).map((list) => (
                  <div
                    key={list.id}
                    onClick={() => onNavigateTab("shopping")}
                    className="p-3 rounded-element border border-edge-light dark:border-edge-dark hover:border-emerald-300 dark:hover:border-emerald-800/60 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {list.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatNumber(list.item_count)} items • {formatNumber(list.checked_count)} checked
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-navy-900 dark:text-slate-100 font-mono">
                        {formatNumber(list.total_cost)} {t("common.bdt")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab("shopping")}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium pt-2 border-t border-edge-light/60 dark:border-edge-dark/60 flex items-center justify-between"
        >
          <span>Open Shopping Manager</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Study Sessions Overview Card */}
      <div className="rounded-card bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark p-5 shadow-subtle flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-edge-light dark:border-edge-dark">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-element bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40 flex items-center justify-center">
                <BookOpen className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy-900 dark:text-slate-100">
                  Recent Study Sessions
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  AI summaries, explanations & practice quizzes
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab("study")}
              className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4">
            {studySessions.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No study sessions recorded.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateTab("study")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start new session</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {studySessions.slice(0, 3).map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => onNavigateTab("study")}
                    className="p-3 rounded-element border border-edge-light dark:border-edge-dark hover:border-cyan-300 dark:hover:border-cyan-800/60 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {sess.title}
                      </p>
                      <p className="text-[11px] text-slate-500 capitalize flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>{sess.document_type}</span>
                        </span>
                        {sess.question_count > 0 && (
                          <span>• {formatNumber(sess.question_count)} quiz questions</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold bg-slate-200/70 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                        {sess.language}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab("study")}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium pt-2 border-t border-edge-light/60 dark:border-edge-dark/60 flex items-center justify-between"
        >
          <span>Open Study Assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
