import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  CalendarClock,
  BookOpen,
  Settings,
  LogOut,
  Sun,
  Moon,
  Globe,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { useTheme } from "../../context/ThemeContext";

export function Sidebar({ currentTab, onSelectTab }) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { id: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { id: "shopping", label: t("nav.shopping"), icon: ShoppingCart },
    { id: "reminders", label: t("nav.reminders"), icon: CalendarClock },
    { id: "study", label: t("nav.study"), icon: BookOpen },
    { id: "settings", label: t("nav.settings"), icon: Settings },
  ];

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
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-surface-light dark:bg-surface-dark border-r border-edge-light dark:border-edge-dark h-screen sticky top-0 select-none">
      {/* Product Logo & Identity */}
      <div className="p-5 border-b border-edge-light dark:border-edge-dark flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-element bg-navy-900 text-white dark:bg-indigo-500 flex items-center justify-center shadow-subtle">
            <Sparkles className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-navy-900 dark:text-slate-100 leading-none">
              {t("app.name")}
            </h1>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
              AI Command Center
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-element transition-all ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-subtle border-l-2 border-indigo-500"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0 stroke-[1.8]" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Preferences & Account Card */}
      <div className="p-3 border-t border-edge-light dark:border-edge-dark space-y-2">
        {/* Quick Language & Theme Toggles */}
        <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-element border border-edge-light dark:border-edge-dark">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="uppercase font-bold tracking-wider text-[10px]">
              {language}
            </span>
          </button>

          <button
            type="button"
            onClick={cycleTheme}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:text-slate-900 dark:hover:text-slate-200 transition-colors capitalize text-[10px] font-semibold"
            title={`Current theme: ${theme}`}
          >
            {theme === "dark" ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5" />
            )}
            <span>{theme}</span>
          </button>
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-element bg-slate-50/70 dark:bg-slate-800/30 border border-edge-light dark:border-edge-dark">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-7 h-7 rounded-full bg-navy-900 text-white dark:bg-indigo-500 font-bold text-xs flex items-center justify-center shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-status-danger rounded transition-colors"
            title={t("nav.logout")}
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
