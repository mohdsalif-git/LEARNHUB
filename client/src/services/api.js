// In development (.env.development), VITE_API_URL is intentionally empty so we
// fall through to the Vite proxy path "/api" (→ http://localhost:5000/api).
// In production, VITE_API_URL is set to the deployed backend URL in .env.
const API_URL = (import.meta.env.VITE_API_URL || "").trim()
  ? import.meta.env.VITE_API_URL.trim().replace(/\/+$/, "")
  : "/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("learnhub_token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const response = await fetch(`${API_URL}${normalizedEndpoint}`, {
    cache: "no-store",
    ...options,
    headers,
  });

  // Try to parse error response
  let data;
  try {
    data = await response.json();
  } catch {
    data = { message: "Request failed" };
  }

  if (!response.ok) {
    const isAuthAttempt =
      normalizedEndpoint.startsWith("/auth/login") ||
      normalizedEndpoint.startsWith("/auth/register");

    // Only handle token expiry / auto-logout if a token was actually attached
    // and this is not an invalid credentials attempt on login/register
    if (response.status === 401 && token && !isAuthAttempt) {
      localStorage.removeItem("learnhub_token");
      window.dispatchEvent(new Event("auth logout"));
    }
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};