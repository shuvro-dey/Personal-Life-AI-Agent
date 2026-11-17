import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useI18n } from "../../context/I18nContext";

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  message,
  loading = false,
}) {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || t("common.delete")}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {message || (
            <>
              Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-slate-100">{itemName}</span>? This action cannot be undone.
            </>
          )}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
          >
            {t("common.delete")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
