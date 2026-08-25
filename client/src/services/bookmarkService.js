import { api } from "./api";

export const bookmarkService = {
  getAll: () => api.get("/bookmarks"),
  toggle: (resourceId) => api.post("/bookmarks/toggle", { resourceId }),
  add: (resourceId) => api.post("/bookmarks", { resourceId }),
  remove: (resourceId) => api.delete(`/bookmarks/${resourceId}`),
};
