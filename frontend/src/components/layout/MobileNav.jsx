import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  CalendarClock,
  BookOpen,
  Settings,
} from "lucide-react";
import { useI18n } from "../../context/I18nContext";

export function MobileNav({ currentTab, onSelectTab }) {
  const { t } = useI18n();

  const navItems = [
    { id: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { id: "shopping", label: t("nav.shopping"), icon: ShoppingCart },
    { id: "reminders", label: t("nav.reminders"), icon: CalendarClock },
    { id: "study", label: t("nav.study"), icon: BookOpen },
    { id: "settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-edge-light dark:border-edge-dark flex items-center justify-around h-16 px-2 safe-bottom shadow-card">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[50px] px-2 py-1.5 rounded-element transition-all ${
              isActive
                ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            {isActive && (
              <span className="absolute top-1 w-6 h-0.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
            )}
            <Icon className={`w-4 h-4 stroke-[2] ${isActive ? "scale-110" : ""}`} />
            <span className="text-[10px] mt-1 leading-none tracking-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
