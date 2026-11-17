import React from "react";
import {
  CalendarClock,
  Clock,
  Check,
  ArrowRight,
  Plus,
  Repeat,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";
import { formatTimeAmPm } from "../../utils/dateUtils";

export function UpcomingRemindersCard({
  reminders = [],
  onToggleReminder,
  onNavigateTab,
}) {
  const { t, formatNumber } = useI18n();

  return (
    <div className="rounded-card bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark p-5 shadow-subtle flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-edge-light dark:border-edge-dark">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-element bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-center">
            <CalendarClock className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-navy-900 dark:text-slate-100">
              Upcoming Activities & Reminders
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Today's scheduled deadlines (Asia/Dhaka)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab("reminders")}
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Reminders List or Empty State */}
      <div className="flex-1">
        {reminders.length === 0 ? (
          <div className="py-8 text-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-edge-light dark:border-edge-dark flex items-center justify-center mx-auto text-slate-400">
              <CalendarClock className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                No reminders due for today
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Your schedule is clear. Plan ahead by adding a new reminder.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("reminders")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-element bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Reminder</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {reminders.map((rem) => {
              const isDone = rem.status === "done";
              const formattedTime = formatTimeAmPm(rem.due_time);

              return (
                <div
                  key={rem.id}
                  className={`p-3 rounded-element border transition-all flex items-center justify-between gap-3 ${
                    isDone
                      ? "bg-slate-50/60 dark:bg-slate-800/20 border-edge-light/60 dark:border-edge-dark/60 opacity-60"
                      : "bg-surface-light dark:bg-surface-dark border-edge-light dark:border-edge-dark hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Interactive Checkbox */}
                    <button
                      type="button"
                      onClick={() => onToggleReminder(rem.id)}
                      className={`w-5 h-5 rounded-element border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        isDone
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-800"
                      }`}
                      aria-label={isDone ? "Mark pending" : "Mark done"}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-medium text-slate-800 dark:text-slate-200 truncate ${
                          isDone ? "line-through text-slate-400 dark:text-slate-500" : ""
                        }`}
                      >
                        {rem.title}
                      </p>
                      {rem.repeat && rem.repeat !== "none" && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 capitalize mt-0.5">
                          <Repeat className="w-2.5 h-2.5" />
                          <span>{rem.repeat}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time Badge */}
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shrink-0">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formattedTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer link */}
      {reminders.length > 0 && (
        <div className="pt-2 border-t border-edge-light/60 dark:border-edge-dark/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>{formatNumber(reminders.length)} activity scheduled</span>
          <button
            type="button"
            onClick={() => onNavigateTab("reminders")}
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Manage reminders
          </button>
        </div>
      )}
    </div>
  );
}
