import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ShoppingBag,
  ListPlus,
  CheckCircle2,
} from "lucide-react";
import { shoppingService } from "../services/shoppingService";
import { ShoppingItemRow } from "../components/shopping/ShoppingItemRow";
import { SmartAddModal } from "../components/shopping/SmartAddModal";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { EmptyState } from "../components/common/EmptyState";
import { Modal } from "../components/common/Modal";
import { useToast } from "../components/common/Toast";
import { useI18n } from "../context/I18nContext";

export function ShoppingPage() {
  const { t, formatNumber } = useI18n();
  const { addToast } = useToast();

  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(null);
  const [currentListDetail, setCurrentListDetail] = useState(null);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modals state
  const [isSmartAddOpen, setIsSmartAddOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTargetList, setDeleteTargetList] = useState(null);
  const [deleteTargetItem, setDeleteTargetItem] = useState(null);

  // Manual Quick Add Item state
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("piece");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  const loadLists = useCallback(async () => {
    try {
      const data = await shoppingService.getLists();
      setLists(data);
      if (data.length > 0 && !selectedListId) {
        setSelectedListId(data[0].id);
      }
    } catch (err) {
      addToast("Failed to load shopping lists.", "danger");
    } finally {
      setLoadingLists(false);
    }
  }, [addToast, selectedListId]);

  const loadListDetail = useCallback(async (listId) => {
    if (!listId) return;
    setLoadingDetail(true);
    try {
      const data = await shoppingService.getListDetail(listId);
      setCurrentListDetail(data);
    } catch (err) {
      addToast("Failed to load list details.", "danger");
    } finally {
      setLoadingDetail(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    if (selectedListId) {
      loadListDetail(selectedListId);
    } else {
      setCurrentListDetail(null);
    }
  }, [selectedListId, loadListDetail]);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      const created = await shoppingService.createList(newListName.trim());
      addToast(t("shopping.listCreated"), "success");
      setNewListName("");
      setIsCreateListOpen(false);
      await loadLists();
      setSelectedListId(created.id);
    } catch (err) {
      addToast("Failed to create shopping list.", "danger");
    }
  };

  const handleRenameList = async (e) => {
    e.preventDefault();
    if (!renameValue.trim() || !selectedListId) return;
    try {
      await shoppingService.renameList(selectedListId, renameValue.trim());
      addToast("Shopping list renamed", "success");
      setIsRenameOpen(false);
      await loadLists();
      await loadListDetail(selectedListId);
    } catch (err) {
      addToast("Failed to rename shopping list.", "danger");
    }
  };

  const handleDeleteList = async () => {
    if (!deleteTargetList) return;
    try {
      await shoppingService.deleteList(deleteTargetList.id);
      addToast(t("shopping.listDeleted"), "success");
      setDeleteTargetList(null);
      const remaining = lists.filter((l) => l.id !== deleteTargetList.id);
      setLists(remaining);
      setSelectedListId(remaining.length > 0 ? remaining[0].id : null);
    } catch (err) {
      addToast("Failed to delete shopping list.", "danger");
    }
  };

  const handleToggleItem = async (itemId, isChecked) => {
    try {
      // Optimistic update
      setCurrentListDetail((prev) => {
        if (!prev) return prev;
        const nextItems = prev.items.map((it) =>
          it.id === itemId ? { ...it, is_checked: isChecked } : it
        );
        const checkedCount = nextItems.filter((i) => i.is_checked).length;
        return { ...prev, items: nextItems, checked_count: checkedCount };
      });

      await shoppingService.updateItem(itemId, { is_checked: isChecked });
      loadLists(); // Update counts in sidebar
    } catch (err) {
      addToast("Failed to update item status.", "danger");
      loadListDetail(selectedListId);
    }
  };

  const handleUpdateItem = async (itemId, itemData) => {
    try {
      await shoppingService.updateItem(itemId, itemData);
      addToast("Item updated", "success");
      loadListDetail(selectedListId);
      loadLists();
    } catch (err) {
      addToast("Failed to update item.", "danger");
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTargetItem) return;
    try {
      await shoppingService.deleteItem(deleteTargetItem.id);
      addToast("Item removed", "success");
      setDeleteTargetItem(null);
      loadListDetail(selectedListId);
      loadLists();
    } catch (err) {
      addToast("Failed to delete item.", "danger");
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !selectedListId) return;

    setAddingItem(true);
    try {
      await shoppingService.addItem(selectedListId, {
        name: newItemName.trim(),
        quantity: parseFloat(newItemQty) || 1.0,
        unit: newItemUnit.trim() || "piece",
        price: newItemPrice !== "" ? parseFloat(newItemPrice) : null,
      });
      addToast(t("shopping.itemSaved"), "success");
      setNewItemName("");
      setNewItemQty(1);
      setNewItemUnit("piece");
      setNewItemPrice("");
      loadListDetail(selectedListId);
      loadLists();
    } catch (err) {
      addToast("Failed to add item.", "danger");
    } finally {
      setAddingItem(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-edge-light dark:border-edge-dark">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {t("shopping.title")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("shopping.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCreateListOpen(true)}
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span>{t("shopping.newList")}</span>
          </Button>

          {selectedListId && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSmartAddOpen(true)}
            >
              <span>{t("shopping.smartAdd")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Layout: Left lists selector + Right list items */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Lists */}
        <div className="md:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            <span>{t("shopping.myLists")}</span>
            <span>{formatNumber(lists.length)}</span>
          </div>

          {loadingLists ? (
            <div className="space-y-2">
              <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-element animate-pulse" />
              <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-element animate-pulse" />
            </div>
          ) : lists.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={t("shopping.noLists")}
              description={t("shopping.createFirstList")}
              actionLabel={t("shopping.newList")}
              onAction={() => setIsCreateListOpen(true)}
            />
          ) : (
            <div className="space-y-1.5">
              {lists.map((sList) => {
                const isSelected = selectedListId === sList.id;
                return (
                  <div
                    key={sList.id}
                    onClick={() => setSelectedListId(sList.id)}
                    className={`p-3 rounded-card border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-brand-50/70 dark:bg-brand-500/10 border-brand-500/40 text-slate-900 dark:text-slate-100"
                        : "bg-surface-light dark:bg-surface-dark border-edge-light dark:border-edge-dark hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium truncate">{sList.title}</p>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums">
                        {formatNumber(sList.total_cost)} {t("common.bdt")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        {formatNumber(sList.item_count)} {t("shopping.itemsCount")}
                      </span>
                      {sList.item_count > 0 && (
                        <span>
                          {formatNumber(sList.checked_count)}/{formatNumber(sList.item_count)} {t("shopping.completedCount")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active List Details */}
        <div className="md:col-span-8 space-y-4">
          {currentListDetail ? (
            <>
              {/* Selected List Action Bar */}
              <div className="p-4 bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {currentListDetail.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setRenameValue(currentListDetail.title);
                        setIsRenameOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                      aria-label="Rename list"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetList(currentListDetail)}
                      className="p-1 text-slate-400 hover:text-status-danger rounded"
                      aria-label="Delete list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatNumber(currentListDetail.checked_count)} of {formatNumber(currentListDetail.item_count)} {t("shopping.completedCount")}
                  </p>
                </div>

                {/* Deterministic Backend Calculated Total */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-edge-light dark:border-edge-dark px-3 py-2 rounded-element text-right shrink-0">
                  <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                    {t("shopping.totalCost")}
                  </p>
                  <p className="text-base font-bold text-brand-600 dark:text-brand-400 tabular-nums">
                    {formatNumber(currentListDetail.total_cost)} {t("common.bdt")}
                  </p>
                </div>
              </div>

              {/* Manual Quick Add Item Form */}
              <form
                onSubmit={handleAddItem}
                className="p-3 bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card flex flex-wrap gap-2 items-center"
              >
                <div className="flex-1 min-w-[150px]">
                  <Input
                    placeholder={t("shopping.itemNamePlaceholder")}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required
                  />
                </div>
                <div className="w-16">
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="Qty"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <Input
                    placeholder="Unit"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Price (BDT)"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  size="md"
                  loading={addingItem}
                  disabled={!newItemName.trim()}
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("shopping.addItem")}</span>
                </Button>
              </form>

              {/* Items List */}
              {loadingDetail ? (
                <div className="space-y-2 py-4">
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              ) : currentListDetail.items.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title={t("shopping.emptyList")}
                  description="Add items manually or use Smart Add to parse from natural text."
                  actionLabel={t("shopping.smartAdd")}
                  onAction={() => setIsSmartAddOpen(true)}
                />
              ) : (
                <div className="space-y-2">
                  {currentListDetail.items.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      onToggle={handleToggleItem}
                      onUpdate={handleUpdateItem}
                      onDelete={(id, name) => setDeleteTargetItem({ id, name })}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card">
              Select or create a shopping list to view items.
            </div>
          )}
        </div>
      </div>

      {/* Smart Add Modal */}
      {selectedListId && (
        <SmartAddModal
          isOpen={isSmartAddOpen}
          onClose={() => setIsSmartAddOpen(false)}
          listId={selectedListId}
          onSuccess={() => {
            loadListDetail(selectedListId);
            loadLists();
          }}
        />
      )}

      {/* Create List Modal */}
      <Modal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        title={t("shopping.newList")}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateList} className="space-y-4">
          <Input
            label={t("common.title")}
            placeholder={t("shopping.listTitlePlaceholder")}
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsCreateListOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!newListName.trim()}>
              {t("common.create")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rename List Modal */}
      <Modal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        title="Rename Shopping List"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRenameList} className="space-y-4">
          <Input
            label={t("common.title")}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            required
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsRenameOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!renameValue.trim()}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete List Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetList}
        onClose={() => setDeleteTargetList(null)}
        onConfirm={handleDeleteList}
        title={t("shopping.deleteConfirmTitle")}
        itemName={deleteTargetList?.title || ""}
      />

      {/* Confirm Delete Item Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetItem}
        onClose={() => setDeleteTargetItem(null)}
        onConfirm={handleDeleteItem}
        title="Delete Item"
        itemName={deleteTargetItem?.name || ""}
      />
    </div>
  );
}
