import { api } from "./api";

export const contentService = {
  getPublicSettings: () => api.get("/public/settings"),
  getPublicStats: () => api.get("/public/stats"),
  getTeam: () => api.get("/public/team"),
  getWhyCards: () => api.get("/public/why-cards"),
  getHowSteps: () => api.get("/public/how-steps"),
};
