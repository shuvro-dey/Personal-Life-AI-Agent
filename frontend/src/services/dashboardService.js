import api from "./api";

export const dashboardService = {
  async getOverview() {
    const res = await api.get("/dashboard/overview");
    return res.data;
  },

  async executeCommand(query) {
    const res = await api.post("/dashboard/command", { query });
    return res.data;
  },
};
