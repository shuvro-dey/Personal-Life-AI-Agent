import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarClock,
  Plus,
  Bell,
  CheckCircle2,
  Calendar,
  Clock,
} from "lucide-react";
import { reminderService } from "../services/reminderService";
import { ReminderCard } from "../components/reminders/ReminderCard";
import { ReminderFormModal } from "../components/reminders/ReminderFormModal";
import { SmartReminderModal } from "../components/reminders/SmartReminderModal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { EmptyState } from "../components/common/EmptyState";
import { Button } from "../components/common/Button";
import { useToast } from "../components/common/Toast";
import { useNotifications } from "../context/NotificationContext";
import { useI18n } from "../context/I18nContext";

export function RemindersPage() {
  const { t, formatNumber } = useI18n();
  const { addToast } = useToast();
  const { permission, requestPermission } = useNotifications();

  const [view, setView] = useState("today"); // "today" | "upcoming" | "completed"
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSmartOpen, setIsSmartOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [savingForm, setSavingForm] = useState(false);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reminderService.getReminders(view);
      setReminders(data);
    } catch (err) {
      addToast("Failed to load reminders.", "danger");
    } finally {
      setLoading(false);
    }
  }, [view, addToast]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const handleToggle = async (reminderId) => {
    try {
      // Optimistic update
      setReminders((prev) =>
        prev.map((r) =>
          r.id === reminderId
            ? { ...r, status: r.status === "done" ? "pending" : "done" }
            : r
        )
      );

      await reminderService.toggleReminder(reminderId);
      // Reload after slight delay to respect view filtering
      setTimeout(() => {
        loadReminders();
      }, 250);
    } catch (err) {
      addToast("Failed to update reminder status.", "danger");
      loadReminders();
    }
  };

  const handleSaveForm = async (formData) => {
    setSavingForm(true);
    try {
      if (editTarget) {
        await reminderService.updateReminder(editTarget.id, formData);
        addToast("Reminder updated", "success");
      } else {
        await reminderService.createReminder(formData);
        addToast(t("reminders.reminderSaved"), "success");
      }
      setIsFormOpen(false);
      setEditTarget(null);
      loadReminders();
    } catch (err) {
      addToast("Failed to save reminder.", "danger");
    } finally {
      setSavingForm(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await reminderService.deleteReminder(deleteTarget.id);
      addToast(t("reminders.reminderDeleted"), "success");
      setDeleteTarget(null);
      loadReminders();
    } catch (err) {
      addToast("Failed to delete reminder.", "danger");
    }
  };

  const tabs = [
    { id: "today", label: t("reminders.tabToday") },
    { id: "upcoming", label: t("reminders.tabUpcoming") },
    { id: "completed", label: t("reminders.tabCompleted") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-edge-light dark:border-edge-dark">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {t("reminders.title")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("reminders.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("reminders.newReminder")}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSmartOpen(true)}
          >
            <span>{t("reminders.smartAdd")}</span>
          </Button>
        </div>
      </div>

      {/* Browser Notification Permission Banner */}
      {permission === "default" && (
        <div className="p-3 bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 rounded-card flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
            <Bell className="w-4 h-4 shrink-0" />
            <span>Enable browser alerts for timely due reminder notifications.</span>
          </div>
          <Button variant="primary" size="sm" onClick={requestPermission}>
            Enable alerts
          </Button>
        </div>
      )}

      {/* Segmented View Switcher */}
      <div className="flex items-center border-b border-edge-light dark:border-edge-dark gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
              view === tab.id
                ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="space-y-2 py-2">
          <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-card animate-pulse" />
          <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-card animate-pulse" />
          <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-card animate-pulse" />
        </div>
      ) : reminders.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={
            view === "today"
              ? t("reminders.emptyToday")
              : view === "upcoming"
              ? t("reminders.emptyUpcoming")
              : t("reminders.emptyCompleted")
          }
          description="Schedule reminders using natural text or the standard picker."
          actionLabel={t("reminders.newReminder")}
          onAction={() => {
            setEditTarget(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onToggle={handleToggle}
              onEdit={(r) => {
                setEditTarget(r);
                setIsFormOpen(true);
              }}
              onDelete={(id, title) => setDeleteTarget({ id, title })}
            />
          ))}
        </div>
      )}

      {/* Manual Reminder Form Modal */}
      <ReminderFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditTarget(null);
        }}
        onSave={handleSaveForm}
        initialData={editTarget}
        loading={savingForm}
      />

      {/* Smart Reminder Modal */}
      <SmartReminderModal
        isOpen={isSmartOpen}
        onClose={() => setIsSmartOpen(false)}
        onSuccess={loadReminders}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Reminder"
        itemName={deleteTarget?.title || ""}
      />
    </div>
  );
}
