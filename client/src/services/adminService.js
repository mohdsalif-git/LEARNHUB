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
};