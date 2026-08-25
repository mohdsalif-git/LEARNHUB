import { api } from "./api";

export const adminService = {
  getDashboard: () => api.get("/admin/dashboard"),
  getUsers: () => api.get("/admin/users"),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  getPayments: () => api.get("/admin/payments"),
  getSupporters: () => api.get("/admin/supporters"),
  getSupport: () => api.get("/admin/support"),
  getFeedback: () => api.get("/admin/feedback"),
  claimAdmin: () => api.post("/admin/claim-admin"),
};
