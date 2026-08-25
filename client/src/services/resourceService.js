import { api } from "./api";

export const resourceService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/resources${query ? `?${query}` : ""}`);
  },
  getById: (id) => api.get(`/resources/${id}`),
  create: (data) => api.post("/resources", data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
  getCommunity: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/resources/community${query ? `?${query}` : ""}`);
  },
  submit: (data) => api.post("/resources/submit", data),
};
