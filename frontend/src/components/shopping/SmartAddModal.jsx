import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Trash2, Sparkles, Plus } from "lucide-react";
import { shoppingService } from "../../services/shoppingService";
import { useI18n } from "../../context/I18nContext";
import { useToast } from "../common/Toast";

export function SmartAddModal({
  isOpen,
  onClose,
  listId,
  onSuccess,
}) {
  const { t, language, formatNumber } = useI18n();
  const { addToast } = useToast();

  const [naturalText, setNaturalText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleParse = async (e) => {
    e.preventDefault();
    if (!naturalText.trim()) return;

    setParsing(true);
    try {
      const res = await shoppingService.smartParse(naturalText, language);
      setParsedItems(res.items || []);
      setHasParsed(true);
    } catch (err) {
      addToast("Failed to parse items. Please check input.", "danger");
    } finally {
      setParsing(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    setParsedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveItem = (index) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddBlankRow = () => {
    setParsedItems((prev) => [
      ...prev,
      { name: "", quantity: 1.0, unit: "piece", price: null },
    ]);
  };

  const handleSaveAll = async () => {
    const validItems = parsedItems
      .filter((it) => it.name && it.name.trim())
      .map((it) => ({
        name: it.name.trim(),
        quantity: parseFloat(it.quantity) || 1.0,
        unit: (it.unit || "piece").trim(),
        price: it.price !== null && it.price !== "" ? parseFloat(it.price) : null,
        is_checked: false,
      }));

    if (validItems.length === 0) {
      addToast("Please provide at least one valid item.", "danger");
      return;
    }

    setSaving(true);
    try {
      await shoppingService.batchAddItems(listId, validItems);
      addToast(t("shopping.savedSuccess"), "success");
      onSuccess();
      handleClose();
    } catch (err) {
      addToast("Failed to save items to list.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNaturalText("");
    setParsedItems([]);
    setHasParsed(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("shopping.smartAdd")}
      description={t("shopping.smartAddDesc")}
      maxWidth="max-w-xl"
    >
      {!hasParsed ? (
        <form onSubmit={handleParse} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Natural Language Items
            </label>
            <textarea
              rows={4}
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
              placeholder={t("shopping.smartAddPlaceholder")}
              className="w-full p-3 text-sm bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-element text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              autoFocus
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Supports natural phrasing in Bangla (বাংলা) and English.
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
              {t("shopping.parseButton")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {t("shopping.previewTitle")}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              {t("shopping.previewDesc")}
            </p>

            <div className="border border-edge-light dark:border-edge-dark rounded-element overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-edge-light dark:border-edge-dark text-slate-600 dark:text-slate-400 font-medium">
                  <tr>
                    <th className="p-2.5">{t("shopping.colItem")}</th>
                    <th className="p-2.5 w-20">{t("shopping.colQty")}</th>
                    <th className="p-2.5 w-24">{t("shopping.colUnit")}</th>
                    <th className="p-2.5 w-24">{t("shopping.colPrice")}</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge-light dark:divide-edge-dark">
                  {parsedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                          className="w-full h-8 px-2 bg-transparent border border-edge-light dark:border-edge-dark rounded text-xs focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full h-8 px-2 bg-transparent border border-edge-light dark:border-edge-dark rounded text-xs focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                          className="w-full h-8 px-2 bg-transparent border border-edge-light dark:border-edge-dark rounded text-xs focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="0"
                          value={item.price !== null && item.price !== undefined ? item.price : ""}
                          onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                          className="w-full h-8 px-2 bg-transparent border border-edge-light dark:border-edge-dark rounded text-xs focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-status-danger p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={handleAddBlankRow}
              className="mt-2 text-xs text-brand-500 hover:text-brand-600 font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add row</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-edge-light dark:border-edge-dark">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHasParsed(false)}
            >
              Re-enter text
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAll}
                loading={saving}
                loadingText={t("common.working")}
              >
                {t("shopping.saveItems")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
