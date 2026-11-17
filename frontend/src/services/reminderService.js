import api from "./api";

export const reminderService = {
  async getReminders(view = "") {
    const params = view ? { view } : {};
    const res = await api.get("/reminders", { params });
    return res.data;
  },

  async createReminder(data) {
    const res = await api.post("/reminders", data);
    return res.data;
  },

  async updateReminder(reminderId, data) {
    const res = await api.put(`/reminders/${reminderId}`, data);
    return res.data;
  },

  async toggleReminder(reminderId) {
    const res = await api.patch(`/reminders/${reminderId}/toggle`);
    return res.data;
  },

  async deleteReminder(reminderId) {
    const res = await api.delete(`/reminders/${reminderId}`);
    return res.data;
  },

  async smartParse(text, currentTimeIso = "") {
    const res = await api.post("/reminders/smart-parse", {
      text,
      current_time_iso: currentTimeIso,
    });
    return res.data;
  },

  async getDueNotifications() {
    const res = await api.get("/reminders/due-notifications");
    return res.data;
  },
};
