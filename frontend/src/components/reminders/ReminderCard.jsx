import React from "react";
import { Check, Clock, Calendar, Repeat, Trash2, Edit2 } from "lucide-react";
import { useI18n } from "../../context/I18nContext";

export function ReminderCard({
  reminder,
  onToggle,
  onEdit,
  onDelete,
}) {
  const { t, formatNumber } = useI18n();

  const isCompleted = reminder.status === "done";

  return (
    <div
      className={`group flex items-start justify-between p-3.5 rounded-card border transition-colors ${
        isCompleted
          ? "bg-slate-50/50 dark:bg-surface-dark/40 border-edge-light/60 dark:border-edge-dark/60 text-slate-400 dark:text-slate-500"
          : "bg-surface-light dark:bg-surface-dark border-edge-light dark:border-edge-dark hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-slate-100"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <button
          type="button"
          onClick={() => onToggle(reminder.id)}
          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
            isCompleted
              ? "bg-brand-500 border-brand-500 text-white"
              : "border-slate-300 dark:border-slate-600 hover:border-brand-500"
          }`}
          aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
        >
          {isCompleted && <Check className="w-3 h-3 stroke-[2.5]" />}
        </button>

        <div className="min-w-0">
          <p
            className={`text-sm font-medium ${
              isCompleted ? "line-through text-slate-400 dark:text-slate-500" : ""
            }`}
          >
            {reminder.title}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatNumber(reminder.due_date)}
            </span>

            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatNumber(reminder.due_time.substring(0, 5))}
            </span>

            {reminder.repeat !== "none" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                <Repeat className="w-3 h-3" />
                <span className="capitalize">{reminder.repeat}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-3 shrink-0">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(reminder)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            aria-label="Edit reminder"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(reminder.id, reminder.title)}
          className="p-1 text-slate-400 hover:text-status-danger rounded"
          aria-label="Delete reminder"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
