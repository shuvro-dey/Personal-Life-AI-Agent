import React, { useState, useRef } from "react";
import {
  Sparkles,
  Send,
  CornerDownLeft,
  CalendarPlus,
  ShoppingBag,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { Button } from "../common/Button";
import { useI18n } from "../../context/I18nContext";

export function HeroAIAssistant({
  onExecuteCommand,
  loading = false,
  feedback = null,
  onNavigateTab,
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    onExecuteCommand(query.trim());
    setQuery("");
  };

  const handleQuickAction = (template) => {
    setQuery(template);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const quickActions = [
    {
      id: "remind",
      label: "Add Reminder",
      icon: CalendarPlus,
      template: "Remind me tomorrow at 9 AM to review notes",
    },
    {
      id: "shopping",
      label: "Parse Groceries",
      icon: ShoppingBag,
      template: "Buy 2 kg rice, 1 liter milk, 6 eggs, and salt",
    },
    {
      id: "study",
      label: "Start Study Session",
      icon: BookOpen,
      template: "Study session for Operating Systems virtual memory",
    },
  ];

  const getIntentStyles = (intent) => {
    switch (intent) {
      case "reminder":
        return {
          badge: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50",
          icon: CalendarPlus,
          title: "Reminder Created / Clarification",
        };
      case "shopping":
        return {
          badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
          icon: ShoppingBag,
          title: "Grocery Items Extracted",
        };
      case "study":
        return {
          badge: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/50",
          icon: BookOpen,
          title: "Study Material Routed",
        };
      default:
        return {
          badge: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          icon: HelpCircle,
          title: "AI Response",
        };
    }
  };

  return (
    <div className="relative rounded-card-lg bg-gradient-to-b from-navy-900 to-navy-950 text-white p-6 md:p-8 shadow-card border border-navy-800 overflow-hidden">
      {/* Background Subtle Accent Gradients */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl space-y-6">
        {/* AI Identity Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/20 text-indigo-300 text-xs font-semibold tracking-wide backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Command Center</span>
          </div>

          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
            How can I help you today?
          </h2>

          <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
            Execute tasks in natural language: schedule smart reminders, parse grocery lists, or analyze study documents.
          </p>
        </div>

        {/* Large Message Composer */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative flex items-center rounded-card bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/15 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/30 transition-all p-1.5 shadow-sm">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything: e.g. 'Add 2 kg rice to shopping' or 'Remind me tomorrow at 9 AM to review notes'..."
              disabled={loading}
              className="w-full h-11 pl-3.5 pr-28 text-xs md:text-sm bg-transparent text-white placeholder:text-slate-400 focus:outline-none"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              <Button
                type="submit"
                size="sm"
                variant="primary"
                loading={loading}
                loadingText="Routing"
                disabled={!query.trim() || loading}
                className="h-8 text-xs px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-element shadow-indigo"
              >
                <span className="hidden sm:inline">Execute</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Contextual Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-slate-400 mr-1 hidden sm:inline">
              Suggested:
            </span>
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleQuickAction(action.template)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-element bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-[11px] font-medium text-slate-200 transition-colors cursor-pointer"
                >
                  <ActionIcon className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </form>

        {/* AI Response Feedback Card */}
        {feedback && (
          <div className="p-4 rounded-card bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-slate-100 border border-edge-light dark:border-edge-dark shadow-card animate-in fade-in duration-200 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {(() => {
                  const style = getIntentStyles(feedback.intent);
                  const Icon = style.icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.badge}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="capitalize">{feedback.intent}</span>
                    </span>
                  );
                })()}
              </div>

              {feedback.action_url && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs px-2.5 shrink-0"
                  onClick={() => {
                    const tab = feedback.action_url.replace("/", "");
                    onNavigateTab(tab);
                  }}
                >
                  <span>Open {feedback.intent}</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>

            <p className="text-xs md:text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
              {feedback.message}
            </p>

            {/* If structured shopping items were parsed */}
            {feedback.payload?.items && feedback.payload.items.length > 0 && (
              <div className="p-2.5 rounded-element bg-slate-50 dark:bg-slate-800/50 border border-edge-light dark:border-edge-dark text-xs space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Extracted Items ({feedback.payload.items.length}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {feedback.payload.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark text-[11px] text-slate-800 dark:text-slate-200"
                    >
                      {item.name} ({item.quantity} {item.unit})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
