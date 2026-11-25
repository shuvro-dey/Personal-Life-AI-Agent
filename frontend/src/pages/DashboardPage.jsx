import React, { useState, useEffect, useCallback } from "react";
import { dashboardService } from "../services/dashboardService";
import { reminderService } from "../services/reminderService";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { HeroAIAssistant } from "../components/dashboard/HeroAIAssistant";
import { MetricsGrid } from "../components/dashboard/MetricsGrid";
import { UpcomingRemindersCard } from "../components/dashboard/UpcomingRemindersCard";
import { RecentActivityCard } from "../components/dashboard/RecentActivityCard";
import { ActiveModulesGrid } from "../components/dashboard/ActiveModulesGrid";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton";
import { useToast } from "../components/common/Toast";
import { Button } from "../components/common/Button";
import { RefreshCw, AlertTriangle } from "lucide-react";

export function DashboardPage({ onNavigateTab }) {
  const { addToast } = useToast();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Command input execution state
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState(null);

  const loadOverview = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await dashboardService.getOverview();
      setOverview(data);
    } catch (err) {
      setError("Failed to load dashboard data. Please check your connection.");
      addToast("Failed to load dashboard data.", "danger");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleExecuteCommand = async (queryText) => {
    if (!queryText || commandLoading) return;

    setCommandLoading(true);
    setCommandFeedback(null);
    try {
      const res = await dashboardService.executeCommand(queryText);
      setCommandFeedback(res);
      addToast(`Action routed: ${res.intent}`, "success");
      // Silently refresh overview to reflect any newly created reminders or activity
      await loadOverview(true);
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        "Failed to execute command. Please try again.";
      addToast(errMsg, "danger");
    } finally {
      setCommandLoading(false);
    }
  };

  const handleToggleReminder = async (reminderId) => {
    try {
      await reminderService.toggleReminder(reminderId);
      // Fast optimistic update in state
      setOverview((prev) => {
        if (!prev) return prev;
        const updatedList = prev.today_reminders.map((r) =>
          r.id === reminderId
            ? { ...r, status: r.status === "done" ? "pending" : "done" }
            : r
        );
        const newPendingCount = updatedList.filter((r) => r.status !== "done").length;
        return {
          ...prev,
          today_reminders: updatedList,
          today_reminders_count: newPendingCount,
        };
      });
      addToast("Reminder updated", "success");
    } catch (err) {
      addToast("Failed to update reminder status.", "danger");
      // Revert from server
      await loadOverview(true);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && !overview) {
    return (
      <div className="p-8 text-center bg-surface-light dark:bg-surface-dark border border-edge-light dark:border-edge-dark rounded-card max-w-md mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-status-danger border border-red-200 dark:border-red-800/40 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 stroke-[1.8]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Dashboard Unavailable
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {error}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => loadOverview()}
          className="mx-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </Button>
      </div>
    );
  }

  const dueRemindersCount = overview?.today_reminders?.filter(
    (r) => r.status === "pending"
  ).length || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header Section */}
      <DashboardHeader
        currentTime={overview?.current_time_dhaka}
        dueCount={dueRemindersCount}
      />

      {/* 2. Hero AI Assistant Centerpiece */}
      <HeroAIAssistant
        onExecuteCommand={handleExecuteCommand}
        loading={commandLoading}
        feedback={commandFeedback}
        onNavigateTab={onNavigateTab}
      />

      {/* 3. Daily Metrics Overview Grid */}
      <MetricsGrid
        overview={overview}
        onNavigateTab={onNavigateTab}
      />

      {/* 4. Upcoming Activities & Recent Audit Activity (Two Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingRemindersCard
          reminders={overview?.today_reminders || []}
          onToggleReminder={handleToggleReminder}
          onNavigateTab={onNavigateTab}
        />

        <RecentActivityCard
          activities={overview?.recent_activities || []}
        />
      </div>

      {/* 5. Active Modules Grid (Shopping Lists & Study Sessions) */}
      <ActiveModulesGrid
        shoppingLists={overview?.active_shopping_lists || []}
        studySessions={overview?.recent_study_sessions || []}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
}
