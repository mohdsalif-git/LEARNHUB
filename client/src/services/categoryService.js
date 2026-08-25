import { api } from "./api";

export const categoryService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/categories${query ? `?${query}` : ""}`);
  },
  getBySlug: (slug) => api.get(`/categories/${slug}`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  bulkImport: (categories) => api.post("/categories/bulk-import", { categories }),
};
