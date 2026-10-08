import { api } from "./api";

export const contentService = {
  getPublicSettings: () => api.get("/public/settings"),
  getTeam: () => api.get("/public/team"),
  getWhyCards: () => api.get("/public/why-cards"),
  getHowSteps: () => api.get("/public/how-steps"),
};
