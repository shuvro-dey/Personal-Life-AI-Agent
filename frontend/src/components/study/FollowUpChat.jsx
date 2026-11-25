import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "../common/Button";
import { studyService } from "../../services/studyService";
import { useI18n } from "../../context/I18nContext";

export function FollowUpChat({ sessionId }) {
  const { t } = useI18n();

  const [messages, setMessages] = useState([
    {
      id: "initial",
      role: "assistant",
      text: "You can ask any questions about this study material. I will explain concepts and answer based strictly on the content.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;

    const userMessageText = inputText.trim();
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: userMessageText },
      { id: assistantMsgId, role: "assistant", text: "" },
    ]);
    setInputText("");
    setIsStreaming(true);

    studyService.chatStream(
      sessionId,
      userMessageText,
      (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, text: m.text + chunk } : m
          )
        );
      },
      () => {
        setIsStreaming(false);
      },
      (err) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  text: m.text || "Could not complete answer. Please verify AI service configuration.",
                }
              : m
          )
        );
        setIsStreaming(false);
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card flex flex-col h-[520px] shadow-sm">
      {/* Chat Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-element bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-card px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand-500 text-white"
                  : "bg-slate-50 dark:bg-slate-800/60 border border-edge-light dark:border-edge-dark text-slate-800 dark:text-slate-200"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>

            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-element bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-3 h-3 animate-spin text-brand-500" />
            <span>Streaming answer...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-edge-light dark:border-edge-dark flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30"
      >
        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("study.chatPlaceholder")}
          className="flex-1 px-3 py-2 text-xs bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-element text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!inputText.trim() || isStreaming}
        >
          <Send className="w-3.5 h-3.5" />
          <span>{t("study.send")}</span>
        </Button>
      </form>
    </div>
  );
}
