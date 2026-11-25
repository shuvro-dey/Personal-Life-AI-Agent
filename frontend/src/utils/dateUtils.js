/**
 * Utility functions for date, time, and dynamic greetings.
 * Strict NO EMOJIS constraint respected.
 */

export function getGreeting(name, language = "en") {
  const hour = new Date().getHours();
  const userName = name ? ` ${name}` : "";

  if (language === "bn") {
    if (hour >= 5 && hour < 12) return `শুভ সকাল,${userName}`;
    if (hour >= 12 && hour < 17) return `শুভ অপরাহ্ন,${userName}`;
    if (hour >= 17 && hour < 22) return `শুভ সন্ধ্যা,${userName}`;
    return `শুভ রাত্রি,${userName}`;
  }

  if (hour >= 5 && hour < 12) return `Good morning,${userName}`;
  if (hour >= 12 && hour < 17) return `Good afternoon,${userName}`;
  if (hour >= 17 && hour < 22) return `Good evening,${userName}`;
  return `Good night,${userName}`;
}

export function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return `${mins}m ago`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatTimeAmPm(timeString) {
  if (!timeString) return "";
  const parts = timeString.split(":");
  if (parts.length < 2) return timeString;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${ampm}`;
}
