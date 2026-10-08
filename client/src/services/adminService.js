import { api } from "./api";

export const adminService = {
  getDashboard: () => api.get("/admin/dashboard"),
  getUsers: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page);
    if (params.limit) searchParams.set("limit", params.limit);
    if (params.search) searchParams.set("search", params.search);
    if (params.role) searchParams.set("role", params.role);
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.order) searchParams.set("order", params.order);
    return api.get(`/admin/users?${searchParams.toString()}`);
  },
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getResources: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page);
    if (params.limit) searchParams.set("limit", params.limit);
    if (params.search) searchParams.set("search", params.search);
    if (params.status) searchParams.set("status", params.status);
    if (params.category) searchParams.set("category", params.category);
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.order) searchParams.set("order", params.order);
    return api.get(`/admin/resources?${searchParams.toString()}`);
  },
  getCategories: () => api.get("/admin/categories"),
  updateResource: (id, data) => api.put(`/admin/resources/${id}`, data),
  deleteResource: (id) => api.delete(`/admin/resources/${id}`),
  getPayments: () => api.get("/admin/payments"),
  getSupporters: () => api.get("/admin/supporters"),
  getSupport: () => api.get("/admin/support"),
  getFeedback: () => api.get("/admin/feedback"),
  getAllFeedback: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page);
    if (params.limit) searchParams.set("limit", params.limit);
    if (params.search) searchParams.set("search", params.search);
    if (params.status) searchParams.set("status", params.status);
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.order) searchParams.set("order", params.order);
    return api.get(`/admin/feedback?${searchParams.toString()}`);
  },
  updateFeedback: (id, status) => api.put(`/admin/feedback/${id}`, { status }),
  deleteFeedback: (id) => api.delete(`/admin/feedback/${id}`),
  claimAdmin: () => api.post("/admin/claim-admin"),
  getAnalytics: (period = "30d") => api.get(`/admin/analytics?period=${period}`),
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data) => api.put("/admin/settings", data),
  updateAdminProfile: (data) => api.put("/admin/profile", data),
  changeAdminPassword: (data) => api.put("/admin/password", data),

  // ── Team Members ──
  getTeam: () => api.get("/admin/team"),
  createTeamMember: (data) => api.post("/admin/team", data),
  updateTeamMember: (id, data) => api.put(`/admin/team/${id}`, data),
  deleteTeamMember: (id) => api.delete(`/admin/team/${id}`),

  // ── Why Cards ──
  getWhyCardsAdmin: () => api.get("/admin/why-cards/all"),
  createWhyCard: (data) => api.post("/admin/why-cards", data),
  updateWhyCard: (id, data) => api.put(`/admin/why-cards/${id}`, data),
  deleteWhyCard: (id) => api.delete(`/admin/why-cards/${id}`),

  // ── How Steps ──
  getHowStepsAdmin: () => api.get("/admin/how-steps/all"),
  createHowStep: (data) => api.post("/admin/how-steps", data),
  updateHowStep: (id, data) => api.put(`/admin/how-steps/${id}`, data),
  deleteHowStep: (id) => api.delete(`/admin/how-steps/${id}`),
};