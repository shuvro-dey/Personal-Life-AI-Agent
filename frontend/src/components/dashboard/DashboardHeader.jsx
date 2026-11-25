import React, { useState } from "react";
import {
  Sparkles,
  Bell,
  Globe,
  Sun,
  Moon,
  LogOut,
  User,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { getGreeting } from "../../utils/dateUtils";

export function DashboardHeader({ currentTime, dueCount = 0 }) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const { permission, requestPermission } = useNotifications();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const greeting = getGreeting(user?.name, language);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "bn" : "en");
  };

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-edge-light dark:border-edge-dark">
      {/* Left: Branding & Dynamic Greeting */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-element bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 stroke-[2]" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {t("app.name")}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            Active
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-navy-900 dark:text-slate-100">
          {greeting}
        </h1>

        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span>{t("app.tagline")}</span>
          {currentTime && (
            <>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {currentTime} (Asia/Dhaka)
              </span>
            </>
          )}
        </p>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-2 self-start md:self-auto">
        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => {
            if (permission !== "granted") requestPermission();
          }}
          className="relative p-2 rounded-element border border-edge-light dark:border-edge-dark bg-surface-light dark:bg-surface-dark text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title={
            permission === "granted"
              ? "Notifications enabled"
              : "Click to enable system notifications"
          }
          aria-label="Notification center"
        >
          <Bell className="w-4 h-4 stroke-[1.8]" />
          {dueCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-status-danger text-white text-[9px] font-bold flex items-center justify-center">
              {dueCount > 9 ? "9+" : dueCount}
            </span>
          )}
        </button>

        {/* Language Switcher */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-element border border-edge-light dark:border-edge-dark bg-surface-light dark:bg-surface-dark text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider"
          title="Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>{language}</span>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={cycleTheme}
          className="p-2 rounded-element border border-edge-light dark:border-edge-dark bg-surface-light dark:bg-surface-dark text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title={`Theme: ${theme}`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Moon className="w-4 h-4 stroke-[1.8]" />
          ) : (
            <Sun className="w-4 h-4 stroke-[1.8]" />
          )}
        </button>

        {/* User Profile Chip with Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-element border border-edge-light dark:border-edge-dark bg-surface-light dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            aria-label="User menu"
          >
            <div className="w-6 h-6 rounded-full bg-navy-900 text-white dark:bg-indigo-500 font-bold text-[10px] flex items-center justify-center shrink-0">
              {getInitials(user?.name)}
            </div>
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[100px] truncate">
              {user?.name || "User"}
            </span>
          </button>

          {showProfileMenu && (
            <div
              className="absolute right-0 mt-1.5 w-56 rounded-element border border-edge-light dark:border-edge-dark bg-surface-light dark:bg-surface-dark shadow-card p-2 z-50 text-xs space-y-1"
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div className="px-2 py-1.5 border-b border-edge-light dark:border-edge-dark">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-status-danger hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t("nav.logout")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
