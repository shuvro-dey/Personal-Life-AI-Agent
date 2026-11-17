import React from "react";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/common/Button";

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="pb-4 border-b border-edge-light dark:border-edge-dark">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {t("settings.title")}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Language Preference */}
      <div className="p-4 bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t("settings.language")}
        </h3>
        <div className="flex gap-2">
          <Button
            variant={language === "en" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setLanguage("en")}
          >
            English
          </Button>
          <Button
            variant={language === "bn" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setLanguage("bn")}
          >
            বাংলা (Bangla)
          </Button>
        </div>
      </div>

      {/* Theme Preference */}
      <div className="p-4 bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t("settings.theme")}
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={theme === "light" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setTheme("light")}
          >
            {t("settings.themeLight")}
          </Button>
          <Button
            variant={theme === "dark" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setTheme("dark")}
          >
            {t("settings.themeDark")}
          </Button>
          <Button
            variant={theme === "system" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setTheme("system")}
          >
            {t("settings.themeSystem")}
          </Button>
        </div>
      </div>

      {/* Account Details */}
      <div className="p-4 bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t("settings.account")}
        </h3>
        <div className="space-y-1 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Name: <span className="text-slate-900 dark:text-slate-100 font-medium">{user?.name}</span>
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Email: <span className="text-slate-900 dark:text-slate-100 font-medium">{user?.email}</span>
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Timezone: <span className="text-slate-900 dark:text-slate-100 font-medium">{user?.timezone || "Asia/Dhaka"}</span>
          </p>
        </div>
        <div className="pt-2">
          <Button variant="danger" size="sm" onClick={logout}>
            {t("nav.logout")}
          </Button>
        </div>
      </div>
    </div>
  );
}
