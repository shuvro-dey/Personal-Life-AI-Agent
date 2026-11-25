import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { HelpCircle, Calendar, Clock, Check } from "lucide-react";
import { reminderService } from "../../services/reminderService";
import { useI18n } from "../../context/I18nContext";
import { useToast } from "../common/Toast";

export function SmartReminderModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const { t } = useI18n();
  const { addToast } = useToast();

  const [naturalText, setNaturalText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Parsed state
  const [parseResult, setParseResult] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editRepeat, setEditRepeat] = useState("none");

  const handleParse = async (e) => {
    e.preventDefault();
    if (!naturalText.trim()) return;

    setParsing(true);
    try {
      const res = await reminderService.smartParse(naturalText);
      setParseResult(res);

      if (res.status === "ready" && res.data) {
        setEditTitle(res.data.title || naturalText);
        setEditDate(res.data.due_date || "");
        setEditTime(
          res.data.due_time ? res.data.due_time.substring(0, 5) : "09:00"
        );
        setEditRepeat(res.data.repeat || "none");
      } else {
        // Needs clarification
        setEditTitle(naturalText);
        const todayStr = new Date().toISOString().split("T")[0];
        setEditDate(todayStr);
        setEditTime("09:00");
      }
    } catch (err) {
      addToast("Failed to parse reminder. Please enter manually.", "danger");
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDate || !editTime) {
      addToast("Please provide title, date and time.", "danger");
      return;
    }

    setSaving(true);
    try {
      await reminderService.createReminder({
        title: editTitle.trim(),
        due_date: editDate,
        due_time: editTime.length === 5 ? `${editTime}:00` : editTime,
        repeat: editRepeat,
      });
      addToast(t("reminders.reminderSaved"), "success");
      onSuccess();
      handleClose();
    } catch (err) {
      addToast("Failed to save reminder.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNaturalText("");
    setParseResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("reminders.smartAdd")}
      description="Extract title, date and time from natural text. Missing details trigger clarification."
      maxWidth="max-w-md"
    >
      {!parseResult ? (
        <form onSubmit={handleParse} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Natural Language Request
            </label>
            <textarea
              rows={3}
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
              placeholder={t("reminders.smartAddPlaceholder")}
              className="w-full p-3 text-sm bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-element text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              autoFocus
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              e.g. "কাল সকাল ৮টায় ওষুধ খেতে মনে করিয়ে দাও" or "Remind me tomorrow at 8 AM"
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-edge-light dark:border-edge-dark">
            <Button variant="secondary" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              loading={parsing}
              loadingText={t("common.working")}
              disabled={!naturalText.trim()}
            >
              {t("reminders.parseButton")}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {parseResult.status === "needs_clarification" && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-element text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{t("reminders.clarificationNeeded")}</span>
              </div>
              <p className="text-amber-800 dark:text-amber-300">
                {parseResult.clarification_question || t("reminders.clarificationDesc")}
              </p>
            </div>
          )}

          {parseResult.status === "ready" && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-element text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Details extracted successfully. Please review before saving.</span>
            </div>
          )}

          <Input
            label={t("reminders.fieldTitle")}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("reminders.fieldDate")}
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              required
            />

            <Input
              label={t("reminders.fieldTime")}
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t("reminders.fieldRepeat")}
            </label>
            <select
              value={editRepeat}
              onChange={(e) => setEditRepeat(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-element text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="none">{t("reminders.repeatNone")}</option>
              <option value="daily">{t("reminders.repeatDaily")}</option>
              <option value="weekly">{t("reminders.repeatWeekly")}</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-edge-light dark:border-edge-dark">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParseResult(null)}
            >
              Re-enter text
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={saving}
                loadingText={t("common.working")}
              >
                {t("reminders.saveReminder")}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
