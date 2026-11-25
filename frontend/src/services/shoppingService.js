import api from "./api";

export const shoppingService = {
  async getLists() {
    const res = await api.get("/shopping/lists");
    return res.data;
  },

  async createList(title) {
    const res = await api.post("/shopping/lists", { title });
    return res.data;
  },

  async getListDetail(listId) {
    const res = await api.get(`/shopping/lists/${listId}`);
    return res.data;
  },

  async renameList(listId, title) {
    const res = await api.put(`/shopping/lists/${listId}`, { title });
    return res.data;
  },

  async deleteList(listId) {
    const res = await api.delete(`/shopping/lists/${listId}`);
    return res.data;
  },

  async addItem(listId, itemData) {
    const res = await api.post(`/shopping/lists/${listId}/items`, itemData);
    return res.data;
  },

  async updateItem(itemId, itemData) {
    const res = await api.put(`/shopping/items/${itemId}`, itemData);
    return res.data;
  },

  async deleteItem(itemId) {
    const res = await api.delete(`/shopping/items/${itemId}`);
    return res.data;
  },

  async smartParse(text, language = "en") {
    const res = await api.post("/shopping/smart-parse", { text, language });
    return res.data;
  },

  async batchAddItems(listId, items) {
    const res = await api.post(`/shopping/lists/${listId}/batch-add`, { items });
    return res.data;
  }
};
