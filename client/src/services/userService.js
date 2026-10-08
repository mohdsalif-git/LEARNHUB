import { api } from "./api";

export const userService = {
  getViewHistory: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page);
    if (params.limit) searchParams.set("limit", params.limit);
    const query = searchParams.toString();
    return api.get(`/users/me/view-history${query ? `?${query}` : ""}`);
  },
  recordView: (resourceId) => {
    return api.post(`/users/me/view-history`, { resourceId });
  },
  removeHistoryItem: (resourceId) => {
    return api.delete(`/users/me/view-history/${resourceId}`);
  },
  getDashboardStats: () => {
    return api.get(`/users/me/stats`);
  },
  updateProfile: (data) => {
    return api.put(`/users/me/profile`, data);
  },
  changePassword: (data) => {
    return api.put(`/users/me/password`, data);
  },
};
