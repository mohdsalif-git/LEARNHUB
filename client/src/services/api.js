const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("learnhub_token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
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
    // Handle token expiry (401) - could auto-logout
    if (response.status === 401) {
      localStorage.removeItem("learnhub_token");
      // Dispatch logout event or notify auth context
      const event = new Event("auth logout");
      window.dispatchEvent(event);
    }
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};