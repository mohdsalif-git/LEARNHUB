import { api } from "./api";

export const feedbackService = {
  getAll: () => api.get("/feedback"),
  create: (data) => api.post("/feedback", data),
};

export const supportService = {
  create: (data) => api.post("/support", data),
};
