import React, { useState } from "react";
import { Upload, FileText, AlignLeft, Check } from "lucide-react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { useI18n } from "../../context/I18nContext";
import { useToast } from "../common/Toast";

export function DocumentUploader({ onStartSession, loading = false }) {
  const { t } = useI18n();
  const { addToast } = useToast();

  const [mode, setMode] = useState("paste"); // "paste" | "upload"
  const [title, setTitle] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState("en");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        addToast("File size exceeds 10 MB limit.", "danger");
        return;
      }
      setSelectedFile(file);
      if (!title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        setTitle(cleanName);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast("Please provide a session title.", "danger");
      return;
    }

    if (mode === "paste" && !pastedText.trim()) {
      addToast("Please paste study text.", "danger");
      return;
    }

    if (mode === "upload" && !selectedFile) {
      addToast("Please select a document file.", "danger");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("language", language);
    if (mode === "paste") {
      formData.append("pasted_text", pastedText.trim());
    } else if (mode === "upload" && selectedFile) {
      formData.append("file", selectedFile);
    }

    onStartSession(formData);
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card p-5 max-w-xl mx-auto shadow-sm">
      <div className="border-b border-edge-light dark:border-edge-dark pb-3 mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("study.newSession")}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Provide study materials for summary, explanation, and quiz generation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Session Title"
          placeholder={t("study.sessionTitlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        {/* Input Mode Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Material Source
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("paste")}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-element border transition-colors ${
                mode === "paste"
                  ? "bg-brand-50/70 dark:bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
                  : "border-edge-light dark:border-edge-dark text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>{t("study.pasteText")}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-element border transition-colors ${
                mode === "upload"
                  ? "bg-brand-50/70 dark:bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
                  : "border-edge-light dark:border-edge-dark text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t("study.uploadDoc")}</span>
            </button>
          </div>
        </div>

        {mode === "paste" ? (
          <div>
            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste lecture notes, book chapters, or revision materials..."
              className="w-full p-3 text-xs font-mono bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-element text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="mt-1 text-[11px] text-slate-500 text-right">
              {pastedText.length} characters
            </p>
          </div>
        ) : (
          <div>
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-edge-light dark:border-edge-dark rounded-card bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
              <FileText className="w-8 h-8 text-slate-400 mb-2 stroke-[1.5]" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {selectedFile ? selectedFile.name : "Select PDF or plain text file"}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {t("study.uploadHelp")}
              </span>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Output Language Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t("study.languageSelect")}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-element border transition-colors ${
                language === "en"
                  ? "bg-brand-50 dark:bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
                  : "border-edge-light dark:border-edge-dark text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {t("study.langEn")}
            </button>
            <button
              type="button"
              onClick={() => setLanguage("bn")}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-element border transition-colors ${
                language === "bn"
                  ? "bg-brand-50 dark:bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
                  : "border-edge-light dark:border-edge-dark text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {t("study.langBn")}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          loading={loading}
          loadingText={t("common.working")}
        >
          {t("study.startSession")}
        </Button>
      </form>
    </div>
  );
}
