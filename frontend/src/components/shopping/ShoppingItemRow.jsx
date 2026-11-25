import React, { useState } from "react";
import { Check, Trash2, Edit2 } from "lucide-react";
import { useI18n } from "../../context/I18nContext";

export function ShoppingItemRow({
  item,
  onToggle,
  onUpdate,
  onDelete,
}) {
  const { t, formatNumber } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editQty, setEditQty] = useState(item.quantity);
  const [editUnit, setEditUnit] = useState(item.unit);
  const [editPrice, setEditPrice] = useState(item.price !== null ? item.price : "");

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    onUpdate(item.id, {
      name: editName.trim(),
      quantity: parseFloat(editQty) || 1.0,
      unit: editUnit.trim() || "piece",
      price: editPrice !== "" ? parseFloat(editPrice) : null,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(item.name);
    setEditQty(item.quantity);
    setEditUnit(item.unit);
    setEditPrice(item.price !== null ? item.price : "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSaveEdit} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-element border border-brand-500/30 flex flex-wrap gap-2 items-center text-xs">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="flex-1 min-w-[140px] h-8 px-2 bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded"
          placeholder={t("shopping.itemNamePlaceholder")}
          autoFocus
        />
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={editQty}
          onChange={(e) => setEditQty(e.target.value)}
          className="w-16 h-8 px-2 bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded"
        />
        <input
          type="text"
          value={editUnit}
          onChange={(e) => setEditUnit(e.target.value)}
          className="w-20 h-8 px-2 bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded"
        />
        <input
          type="number"
          step="1"
          min="0"
          value={editPrice}
          onChange={(e) => setEditPrice(e.target.value)}
          placeholder={t("common.bdt")}
          className="w-20 h-8 px-2 bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded"
        />
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="submit"
            className="px-2.5 py-1.5 bg-brand-500 text-white rounded font-medium hover:bg-brand-600"
          >
            {t("common.save")}
          </button>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="px-2 py-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    );
  }

  const calculatedSubtotal =
    item.price !== null && item.price !== undefined
      ? item.price * item.quantity
      : null;

  return (
    <div
      className={`group flex items-center justify-between p-3 rounded-element border transition-colors ${
        item.is_checked
          ? "bg-slate-50/50 dark:bg-surface-dark/40 border-edge-light/60 dark:border-edge-dark/60 text-slate-400 dark:text-slate-500"
          : "bg-surface-light dark:bg-surface-dark border-edge-light dark:border-edge-dark hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-slate-100"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => onToggle(item.id, !item.is_checked)}
          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
            item.is_checked
              ? "bg-brand-500 border-brand-500 text-white"
              : "border-slate-300 dark:border-slate-600 hover:border-brand-500"
          }`}
          aria-label={item.is_checked ? "Mark uncompleted" : "Mark completed"}
        >
          {item.is_checked && <Check className="w-3 h-3 stroke-[2.5]" />}
        </button>

        <div className="min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              item.is_checked ? "line-through text-slate-400 dark:text-slate-500" : ""
            }`}
          >
            {item.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatNumber(item.quantity)} {item.unit}
            {item.price !== null && (
              <span className="ml-2 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                @{formatNumber(item.price)} {t("common.bdt")}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        {calculatedSubtotal !== null && (
          <span
            className={`text-xs font-semibold tabular-nums ${
              item.is_checked ? "text-slate-400 dark:text-slate-600" : "text-slate-800 dark:text-slate-200"
            }`}
          >
            {formatNumber(calculatedSubtotal.toFixed(0))} {t("common.bdt")}
          </span>
        )}

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            aria-label="Edit item"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id, item.name)}
            className="p-1 text-slate-400 hover:text-status-danger rounded"
            aria-label="Delete item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
