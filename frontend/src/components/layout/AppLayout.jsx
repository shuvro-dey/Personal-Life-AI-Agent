import React from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Globe, Sun, Moon, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { useTheme } from "../../context/ThemeContext";

export function AppLayout({ currentTab, onSelectTab, children }) {
  const { logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "bn" : "en");
  };

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <div className="flex min-h-screen bg-page-light dark:bg-page-dark text-slate-900 dark:text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-edge-light dark:border-edge-dark sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span className="text-sm font-bold text-navy-900 dark:text-slate-100">
              {t("app.name")}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleLanguage}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={logout}
              className="p-2 text-slate-500 hover:text-status-danger"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav currentTab={currentTab} onSelectTab={onSelectTab} />
    </div>
  );
}
