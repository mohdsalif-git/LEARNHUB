import { api } from "./api";

export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  googleLogin: (credential) => api.post("/auth/google", { credential }),
  getMe: () => api.get("/auth/me"),
};