import React from "react";
import {
  CalendarClock,
  ShoppingBag,
  BookOpen,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";

export function MetricsGrid({ overview, onNavigateTab }) {
  const { t, formatNumber } = useI18n();

  const todayRemindersCount = overview?.today_reminders_count || 0;
  const shoppingListsCount = overview?.shopping_lists_count || 0;
  const studySessionsCount = overview?.study_sessions_count || 0;

  // Calculate today completed reminders if present
  const todayReminders = overview?.today_reminders || [];
  const completedTodayCount = todayReminders.filter((r) => r.status === "done").length;
  const totalTodayScheduled = todayReminders.length;
  const completionPercentage = totalTodayScheduled > 0
    ? Math.round((completedTodayCount / totalTodayScheduled) * 100)
    : 100;

  const cards = [
    {
      id: "reminders",
      title: "Today's Reminders",
      value: todayRemindersCount,
      subtitle: `${todayRemindersCount} pending scheduled for today`,
      icon: CalendarClock,
      badgeColor: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40",
      tint: "hover:border-indigo-300 dark:hover:border-indigo-800/60",
      actionTab: "reminders",
    },
    {
      id: "shopping",
      title: "Active Shopping Lists",
      value: shoppingListsCount,
      subtitle: "Lists with deterministic totals",
      icon: ShoppingBag,
      badgeColor: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
      tint: "hover:border-emerald-300 dark:hover:border-emerald-800/60",
      actionTab: "shopping",
    },
    {
      id: "study",
      title: "Study Sessions",
      value: studySessionsCount,
      subtitle: "Summaries, explanations & quizzes",
      icon: BookOpen,
      badgeColor: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40",
      tint: "hover:border-cyan-300 dark:hover:border-cyan-800/60",
      actionTab: "study",
    },
    {
      id: "status",
      title: "Daily Focus Status",
      value: `${completionPercentage}%`,
      subtitle: totalTodayScheduled > 0
        ? `${completedTodayCount} of ${totalTodayScheduled} tasks marked done`
        : "Schedule clear for today",
      icon: CheckCircle2,
      badgeColor: "bg-navy-50 dark:bg-slate-800 text-navy-900 dark:text-slate-100 border-slate-200 dark:border-slate-700",
      tint: "hover:border-slate-400 dark:hover:border-slate-600",
      actionTab: "reminders",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const CardIcon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onNavigateTab(card.actionTab)}
            className={`group p-4 md:p-5 rounded-card bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark shadow-subtle hover:shadow-card-hover transition-all duration-200 cursor-pointer flex flex-col justify-between ${card.tint}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className={`w-9 h-9 rounded-element border flex items-center justify-center shrink-0 ${card.badgeColor}`}>
                <CardIcon className="w-4 h-4 stroke-[2]" />
              </div>

              <span className="p-1 text-slate-400 group-hover:text-indigo-500 transition-colors">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="mt-4 space-y-1">
              <span className="text-2xl md:text-3xl font-bold tracking-tight text-navy-900 dark:text-slate-100 font-sans">
                {typeof card.value === "number" ? formatNumber(card.value) : card.value}
              </span>
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {card.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
