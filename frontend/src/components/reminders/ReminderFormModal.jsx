import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { useI18n } from "../../context/I18nContext";

export function ReminderFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  loading = false,
}) {
  const { t } = useI18n();

  // Get current date string in YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayStr);
  const [dueTime, setDueTime] = useState("09:00");
  const [repeat, setRepeat] = useState("none");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDueDate(initialData.due_date || todayStr);
      setDueTime(
        initialData.due_time ? initialData.due_time.substring(0, 5) : "09:00"
      );
      setRepeat(initialData.repeat || "none");
    } else {
      setTitle("");
      setDueDate(todayStr);
      setDueTime("09:00");
      setRepeat("none");
    }
  }, [initialData, isOpen, todayStr]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !dueTime) return;

    onSave({
      title: title.trim(),
      due_date: dueDate,
      due_time: dueTime.length === 5 ? `${dueTime}:00` : dueTime,
      repeat,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Reminder" : t("reminders.newReminder")}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t("reminders.fieldTitle")}
          placeholder="e.g. Call project partner"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("reminders.fieldDate")}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />

          <Input
            label={t("reminders.fieldTime")}
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t("reminders.fieldRepeat")}
          </label>
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-element text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="none">{t("reminders.repeatNone")}</option>
            <option value="daily">{t("reminders.repeatDaily")}</option>
            <option value="weekly">{t("reminders.repeatWeekly")}</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-edge-light dark:border-edge-dark">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={loading} disabled={!title.trim()}>
            {t("reminders.saveReminder")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
