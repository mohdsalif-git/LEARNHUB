import { api } from "./api";

export const bookmarkService = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.category) searchParams.set("category", params.category);
    if (params.search) searchParams.set("search", params.search);
    const query = searchParams.toString();
    return api.get(`/bookmarks${query ? `?${query}` : ""}`);
  },
  toggle: (resourceId) => api.post("/bookmarks/toggle", { resourceId }),
  add: (resourceId) => api.post("/bookmarks", { resourceId }),
  remove: (resourceId) => api.delete(`/bookmarks/${resourceId}`),
};
