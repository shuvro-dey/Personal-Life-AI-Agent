import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { I18nProvider } from "./context/I18nContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/common/Toast";
import { NotificationProvider } from "./context/NotificationContext";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ShoppingPage } from "./pages/ShoppingPage";
import { RemindersPage } from "./pages/RemindersPage";
import { StudyPage } from "./pages/StudyPage";
import { SettingsPage } from "./pages/SettingsPage";

function MainContent() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState("login"); // "login" | "register"
  const [currentTab, setCurrentTab] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-light dark:bg-page-dark text-slate-500 text-xs">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return authView === "login" ? (
      <LoginPage onNavigateRegister={() => setAuthView("register")} />
    ) : (
      <RegisterPage onNavigateLogin={() => setAuthView("login")} />
    );
  }

  return (
    <AppLayout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === "dashboard" && (
        <DashboardPage onNavigateTab={(tab) => setCurrentTab(tab)} />
      )}
      {currentTab === "shopping" && <ShoppingPage />}
      {currentTab === "reminders" && <RemindersPage />}
      {currentTab === "study" && <StudyPage />}
      {currentTab === "settings" && <SettingsPage />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <MainContent />
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
