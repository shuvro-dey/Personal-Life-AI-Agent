import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { reminderService } from "../services/reminderService";
import { useAuth } from "./AuthContext";
import { useToast } from "../components/common/Toast";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [permission, setPermission] = useState(() => {
    return typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "denied";
  });

  const requestPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const res = await Notification.requestPermission();
        setPermission(res);
        return res;
      } catch (err) {
        return "denied";
      }
    }
    return "denied";
  }, []);

  // Poll for due notifications every 20 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkDue = async () => {
      try {
        const dueReminders = await reminderService.getDueNotifications();
        if (dueReminders && dueReminders.length > 0) {
          dueReminders.forEach((r) => {
            // In-app toast notification
            addToast(`Reminder due: ${r.title}`, "info");

            // Browser Notification API alert
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                new Notification(`Reminder: ${r.title}`, {
                  body: `Scheduled for ${r.due_time} (Asia/Dhaka)`,
                  icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231D4ED8'><circle cx='12' cy='12' r='10'/></svg>",
                });
              } catch (e) {
                // Ignore browser notification restriction error
              }
            }
          });
        }
      } catch (err) {
        // Silent catch for background polling
      }
    };

    checkDue();
    const interval = setInterval(checkDue, 20000);
    return () => clearInterval(interval);
  }, [isAuthenticated, addToast]);

  return (
    <NotificationContext.Provider value={{ permission, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
