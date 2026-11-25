import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  FileText,
  FileCode,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { studyService } from "../services/studyService";
import { DocumentUploader } from "../components/study/DocumentUploader";
import { SummaryView } from "../components/study/SummaryView";
import { ExplanationView } from "../components/study/ExplanationView";
import { QuizPlayer } from "../components/study/QuizPlayer";
import { FollowUpChat } from "../components/study/FollowUpChat";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { EmptyState } from "../components/common/EmptyState";
import { Button } from "../components/common/Button";
import { useToast } from "../components/common/Toast";
import { useI18n } from "../context/I18nContext";

export function StudyPage() {
  const { t, formatNumber } = useI18n();
  const { addToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Active view inside session
  const [activeTab, setActiveTab] = useState("summary"); // "summary" | "explanation" | "quiz" | "chat"
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSource, setShowSource] = useState(false);

  // Action loadings
  const [generatingAction, setGeneratingAction] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const data = await studyService.getSessions();
      setSessions(data);
      if (data.length > 0 && !selectedSessionId && !isCreating) {
        setSelectedSessionId(data[0].id);
      }
    } catch (err) {
      addToast("Failed to load study sessions.", "danger");
    } finally {
      setLoadingSessions(false);
    }
  }, [addToast, selectedSessionId, isCreating]);

  const loadSessionDetail = useCallback(async (id) => {
    if (!id) return;
    setLoadingDetail(true);
    try {
      const data = await studyService.getSessionDetail(id);
      setSessionDetail(data);
    } catch (err) {
      addToast("Failed to load session details.", "danger");
    } finally {
      setLoadingDetail(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (selectedSessionId && !isCreating) {
      loadSessionDetail(selectedSessionId);
    } else {
      setSessionDetail(null);
    }
  }, [selectedSessionId, isCreating, loadSessionDetail]);

  const handleStartSession = async (formData) => {
    try {
      const created = await studyService.createSession(formData);
      addToast("Study session started", "success");
      setIsCreating(false);
      await loadSessions();
      setSelectedSessionId(created.id);
    } catch (err) {
      const msg = err.response?.data?.detail || "Could not create study session.";
      addToast(msg, "danger");
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteTarget) return;
    try {
      await studyService.deleteSession(deleteTarget.id);
      addToast("Study session deleted", "success");
      setDeleteTarget(null);
      const remaining = sessions.filter((s) => s.id !== deleteTarget.id);
      setSessions(remaining);
      setSelectedSessionId(remaining.length > 0 ? remaining[0].id : null);
    } catch (err) {
      addToast("Failed to delete study session.", "danger");
    }
  };

  const handleGenerate = async (action) => {
    if (!selectedSessionId || generatingAction) return;
    setGeneratingAction(true);
    try {
      const lang = sessionDetail?.language || "en";
      await studyService.generateAction(selectedSessionId, action, lang);
      addToast(`${action.charAt(0).toUpperCase() + action.slice(1)} generated`, "success");
      await loadSessionDetail(selectedSessionId);
      await loadSessions();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (err.code === "ECONNABORTED" ? "Generation request timed out. Please try again." : err.message) ||
        `Failed to generate ${action}.`;
      addToast(msg, "danger");
    } finally {
      setGeneratingAction(false);
    }
  };

  const handleSubmitQuiz = async (answers) => {
    if (!selectedSessionId) return;
    setSubmittingQuiz(true);
    try {
      const result = await studyService.submitQuiz(selectedSessionId, answers);
      await loadSessionDetail(selectedSessionId);
      return result;
    } catch (err) {
      throw err;
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const sessionTabs = [
    { id: "summary", label: t("study.tabSummary") },
    { id: "explanation", label: t("study.tabExplanation") },
    { id: "quiz", label: t("study.tabQuiz") },
    { id: "chat", label: t("study.tabChat") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-edge-light dark:border-edge-dark">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {t("study.title")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("study.subtitle")}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setIsCreating(true);
            setSelectedSessionId(null);
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t("study.newSession")}</span>
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Sessions List */}
        <div className="md:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            <span>{t("study.sessions")}</span>
            <span>{formatNumber(sessions.length)}</span>
          </div>

          {loadingSessions ? (
            <div className="space-y-2">
              <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-card animate-pulse" />
              <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-card animate-pulse" />
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={t("study.noSessions")}
              description="Upload a PDF/TXT or paste lecture notes to begin."
              actionLabel={t("study.newSession")}
              onAction={() => setIsCreating(true)}
            />
          ) : (
            <div className="space-y-1.5">
              {sessions.map((sess) => {
                const isSelected = !isCreating && selectedSessionId === sess.id;
                return (
                  <div
                    key={sess.id}
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedSessionId(sess.id);
                    }}
                    className={`p-3 rounded-card border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-brand-50/70 dark:bg-brand-500/10 border-brand-500/40 text-slate-900 dark:text-slate-100"
                        : "bg-surface-light dark:bg-surface-dark border-edge-light dark:border-edge-dark hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium truncate">{sess.title}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                        {sess.language}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span className="capitalize">{sess.document_type}</span>
                      </span>
                      {sess.question_count > 0 && (
                        <span>{formatNumber(sess.question_count)} questions</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Session Workspace */}
        <div className="md:col-span-8">
          {isCreating ? (
            <DocumentUploader
              onStartSession={handleStartSession}
              loading={generatingAction}
            />
          ) : sessionDetail ? (
            <div className="space-y-4">
              {/* Session Top Card */}
              <div className="p-4 bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {sessionDetail.title}
                    </h3>
                    {sessionDetail.document_name && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Source: {sessionDetail.document_name}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(sessionDetail)}
                    className="p-1 text-slate-400 hover:text-status-danger rounded"
                    aria-label="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Collapsible Source Material Viewer */}
                <div className="mt-3 pt-3 border-t border-edge-light dark:border-edge-dark">
                  <button
                    type="button"
                    onClick={() => setShowSource(!showSource)}
                    className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline"
                  >
                    <span>{showSource ? "Hide source text" : "View source text"}</span>
                    {showSource ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {showSource && (
                    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-element border border-edge-light dark:border-edge-dark max-h-48 overflow-y-auto font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {sessionDetail.raw_content}
                    </div>
                  )}
                </div>
              </div>

              {/* Workspace Navigation Tabs */}
              <div className="flex items-center border-b border-edge-light dark:border-edge-dark gap-2">
                {sessionTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                      activeTab === tab.id
                        ? "border-brand-500 text-brand-600 dark:text-brand-400 font-semibold"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Workspace Tab Contents */}
              <div>
                {activeTab === "summary" && (
                  <SummaryView
                    summary={sessionDetail.summary}
                    onGenerate={() => handleGenerate("summary")}
                    loading={generatingAction}
                  />
                )}

                {activeTab === "explanation" && (
                  <ExplanationView
                    explanation={sessionDetail.explanation}
                    onGenerate={() => handleGenerate("explanation")}
                    loading={generatingAction}
                  />
                )}

                {activeTab === "quiz" && (
                  <QuizPlayer
                    questions={sessionDetail.questions}
                    latestSubmission={sessionDetail.latest_submission}
                    onGenerateQuestions={() => handleGenerate("questions")}
                    onSubmitQuiz={handleSubmitQuiz}
                    generating={generatingAction}
                    submitting={submittingQuiz}
                  />
                )}

                {activeTab === "chat" && (
                  <FollowUpChat sessionId={sessionDetail.id} />
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card">
              Select or create a study session to begin.
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSession}
        title="Delete Study Session"
        itemName={deleteTarget?.title || ""}
      />
    </div>
  );
}
