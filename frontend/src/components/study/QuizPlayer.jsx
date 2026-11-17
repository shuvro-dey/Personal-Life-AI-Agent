import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, RefreshCw, Award } from "lucide-react";
import { Button } from "../common/Button";
import { useI18n } from "../../context/I18nContext";
import { useToast } from "../common/Toast";

export function QuizPlayer({
  questions = [],
  latestSubmission = null,
  onGenerateQuestions,
  onSubmitQuiz,
  generating = false,
  submitting = false,
}) {
  const { t, formatNumber } = useI18n();
  const { addToast } = useToast();

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submissionResult, setSubmissionResult] = useState(latestSubmission);

  useEffect(() => {
    setSubmissionResult(latestSubmission);
  }, [latestSubmission]);

  const handleSelectOption = (questionId, option) => {
    if (submissionResult) return; // Prevent changing after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mcqQuestions = questions.filter((q) => q.question_type === "mcq");
    if (Object.keys(selectedAnswers).length < mcqQuestions.length) {
      addToast("Please answer all questions before submitting.", "danger");
      return;
    }

    try {
      const res = await onSubmitQuiz(selectedAnswers);
      setSubmissionResult(res);
      addToast("Quiz graded successfully", "success");
    } catch (err) {
      addToast("Failed to submit quiz.", "danger");
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setSubmissionResult(null);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          No practice questions generated yet
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Test your knowledge with auto-generated multiple-choice questions and instant feedback.
        </p>
        <div className="mt-4">
          <Button
            variant="primary"
            size="sm"
            onClick={onGenerateQuestions}
            loading={generating}
            loadingText={t("common.working")}
          >
            {t("study.generateQuiz")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quiz Top Action & Score Bar */}
      <div className="bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("study.tabQuiz")}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {questions.length} questions available
          </p>
        </div>

        {submissionResult ? (
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-brand-50 dark:bg-brand-500/10 border border-brand-500/20 rounded-element text-xs font-semibold text-brand-700 dark:text-brand-300">
              <span>Score: </span>
              <span className="font-mono text-sm">
                {formatNumber(submissionResult.score)} / {formatNumber(submissionResult.total)} ({formatNumber(submissionResult.percentage)}%)
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleRetake}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retake</span>
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={onGenerateQuestions}
            disabled={generating}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
            <span>Generate new set</span>
          </Button>
        )}
      </div>

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((q, idx) => {
          const userAns = selectedAnswers[q.id];
          const resultItem = submissionResult?.results?.find(
            (r) => r.question_id === q.id
          );

          return (
            <div
              key={q.id}
              className={`p-4 bg-surface-light dark:bg-surface-dark border rounded-card space-y-3 transition-colors ${
                resultItem
                  ? resultItem.is_correct
                    ? "border-emerald-500/40 bg-emerald-50/10"
                    : "border-red-500/40 bg-red-50/10"
                  : "border-edge-light dark:border-edge-dark"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  <span className="font-mono text-slate-400 mr-2 text-xs">
                    {formatNumber(idx + 1)}.
                  </span>
                  {q.question_text}
                </p>

                {resultItem && (
                  <span className="shrink-0 mt-0.5">
                    {resultItem.is_correct ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-status-danger" />
                    )}
                  </span>
                )}
              </div>

              {/* Options for MCQ */}
              {q.question_type === "mcq" && q.options && (
                <div className="space-y-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userAns === opt || resultItem?.user_answer === opt;
                    const isCorrectAnswer =
                      submissionResult &&
                      opt.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                    const isWrongSelection =
                      submissionResult && isSelected && !resultItem?.is_correct;

                    return (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-2.5 rounded-element border text-xs cursor-pointer transition-colors ${
                          isCorrectAnswer
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-medium"
                            : isWrongSelection
                            ? "bg-red-50 dark:bg-red-950/30 border-red-400 text-red-900 dark:text-red-200"
                            : isSelected
                            ? "bg-brand-50/70 dark:bg-brand-500/10 border-brand-500 text-slate-900 dark:text-slate-100 font-medium"
                            : "border-edge-light dark:border-edge-dark hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={opt}
                          checked={isSelected}
                          disabled={!!submissionResult}
                          onChange={() => handleSelectOption(q.id, opt)}
                          className="w-3.5 h-3.5 text-brand-600 border-slate-300 focus:ring-brand-500 shrink-0"
                        />
                        <span className="flex-1">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Short Answer Display */}
              {q.question_type === "short_answer" && (
                <div className="pt-1">
                  {!submissionResult ? (
                    <input
                      type="text"
                      placeholder="Type your brief answer..."
                      value={userAns || ""}
                      onChange={(e) => handleSelectOption(q.id, e.target.value)}
                      className="w-full h-8 px-3 text-xs bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded text-slate-900 dark:text-slate-100"
                    />
                  ) : (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-element border border-edge-light dark:border-edge-dark text-xs space-y-1">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        Expected answer: <span className="font-normal text-slate-600 dark:text-slate-400">{q.correct_answer}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation section after grading */}
              {submissionResult && q.explanation && (
                <div className="p-2.5 rounded-element bg-slate-50 dark:bg-slate-800/40 border border-edge-light dark:border-edge-dark text-[11px] text-slate-600 dark:text-slate-400 mt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}

        {!submissionResult && (
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              loading={submitting}
              loadingText={t("common.working")}
            >
              {t("study.submitQuiz")}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
