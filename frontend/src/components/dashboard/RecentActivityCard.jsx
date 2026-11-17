import React from "react";
import {
  Activity,
  CalendarPlus,
  CalendarX,
  ShoppingBag,
  BookOpen,
  LogIn,
  Trash2,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatRelativeTime } from "../../utils/dateUtils";

export function RecentActivityCard({ activities = [] }) {
  const getActivityMeta = (action) => {
    switch (action) {
      case "reminder_created":
        return {
          icon: CalendarPlus,
          badgeColor: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40",
          title: "Reminder Created",
          category: "Reminder",
        };
      case "reminder_deleted":
        return {
          icon: CalendarX,
          badgeColor: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40",
          title: "Reminder Removed",
          category: "Reminder",
        };
      case "shopping_list_created":
        return {
          icon: ShoppingBag,
          badgeColor: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
          title: "Shopping List Created",
          category: "Shopping",
        };
      case "shopping_list_deleted":
        return {
          icon: Trash2,
          badgeColor: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40",
          title: "Shopping List Removed",
          category: "Shopping",
        };
      case "study_session_created":
        return {
          icon: BookOpen,
          badgeColor: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40",
          title: "Study Session Created",
          category: "Study",
        };
      case "study_session_deleted":
        return {
          icon: Trash2,
          badgeColor: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40",
          title: "Study Session Deleted",
          category: "Study",
        };
      case "user_login":
        return {
          icon: LogIn,
          badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          title: "Account Sign In",
          category: "Auth",
        };
      default:
        return {
          icon: Sparkles,
          badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          title: action.replace(/_/g, " "),
          category: "System",
        };
    }
  };

  const getActivityDetail = (item) => {
    if (!item.details) return "";
    if (item.details.title) return item.details.title;
    if (item.details.email) return item.details.email;
    return "";
  };

  return (
    <div className="rounded-card bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark p-5 shadow-subtle flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-edge-light dark:border-edge-dark">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-element bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <Activity className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-navy-900 dark:text-slate-100">
              Recent System Activity
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Chronological log of user actions
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded border border-edge-light dark:border-edge-dark">
          Real-time Audit
        </span>
      </div>

      {/* Activity Timeline List */}
      <div className="flex-1">
        {activities.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-edge-light dark:border-edge-dark flex items-center justify-center mx-auto text-slate-400">
              <Activity className="w-5 h-5 stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              No recent activity recorded
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Actions in Reminders, Shopping, and Study will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-px before:bg-edge-light dark:before:bg-edge-dark">
            {activities.map((act) => {
              const meta = getActivityMeta(act.action);
              const ActIcon = meta.icon;
              const detailText = getActivityDetail(act);
              const timeFormatted = formatRelativeTime(act.created_at);

              return (
                <div key={act.id} className="relative flex items-start gap-3 pl-1">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 z-10 ${meta.badgeColor}`}>
                    <ActIcon className="w-3 h-3 stroke-[2]" />
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate capitalize">
                        {meta.title}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {timeFormatted}
                      </span>
                    </div>

                    {detailText && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {detailText}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
