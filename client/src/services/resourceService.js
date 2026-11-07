import { api } from "./api";

export const resourceService = {
  getAll: (params = {}) => {
    // If language is provided, route seamlessly through the localization endpoint
    if (params.language && params.language !== "all") {
      const query = new URLSearchParams(params).toString();
      return api.get(`/localization/resources${query ? `?${query}` : ""}`);
    }
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
  recordView: (id) => api.post(`/resources/${id}/view`),
};
