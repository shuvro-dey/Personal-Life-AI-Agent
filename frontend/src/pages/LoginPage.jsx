import React, { useState } from "react";
import { Eye, EyeOff, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";

export function LoginPage({ onNavigateRegister }) {
  const { login } = useAuth();
  const { t, language, setLanguage } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!email.trim() || !password) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMessage(err.response.data.detail);
      } else if (!err.response) {
        setErrorMessage("Cannot connect to the backend server. Please verify the backend is running on port 8000.");
      } else {
        setErrorMessage(t("auth.authFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "bn" : "en");
  };

  return (
    <div className="min-h-screen bg-page-light dark:bg-page-dark flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Language Toggle */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-element text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="uppercase">{language}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-card bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-3 border border-brand-500/20">
            <span className="w-3 h-3 rounded-full bg-brand-500"></span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            {t("app.name")}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("auth.loginTitle")}
          </p>
        </div>

        <div className="mt-8 bg-surface-light dark:bg-surface-dark py-8 px-6 border border-edge-light dark:border-edge-dark rounded-card sm:px-8 shadow-sm">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-element bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-status-danger font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("auth.emailLabel")}
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <div className="relative">
              <Input
                label={t("auth.passwordLabel")}
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-[27px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              loading={loading}
              loadingText={t("common.working")}
            >
              {t("auth.submitLogin")}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-edge-light dark:border-edge-dark pt-4">
            <span>{t("auth.noAccount")} </span>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              {t("auth.signUpLink")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
