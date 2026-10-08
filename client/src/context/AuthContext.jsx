import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

const authStates = {
  INITIALIZING: "initializing",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
  ERROR: "error",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // authLoading is true initially ONLY if a token exists in storage that needs verifying via /auth/me
  const [authLoading, setAuthLoading] = useState(() => {
    return Boolean(typeof window !== "undefined" && localStorage.getItem("learnhub_token"));
  });
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [error, setError] = useState(null);

  // Initial user fetch on page mount — verifies token if present
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("learnhub_token");
    if (!token) {
      setUser(null);
      setTokenExpiry(null);
      setAuthLoading(false);
      setError(null);
      return;
    }

    setAuthLoading(true);

    // Safety timeout — if getMe hangs for >10s, treat as unauthenticated
    // so the app never shows a permanent loading screen.
    const safetyTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 10000);

    try {
      const res = await authService.getMe();
      if (res?.data?.user) {
        setUser(res.data.user);
        if (res.data.expiresAt) {
          setTokenExpiry(res.data.expiresAt);
        }
        setError(null);
      } else {
        throw new Error("Invalid user session");
      }
    } catch (err) {
      localStorage.removeItem("learnhub_token");
      setUser(null);
      setTokenExpiry(null);
      setError(err.message || "Authentication error");
    } finally {
      clearTimeout(safetyTimer);
      setAuthLoading(false);
    }
  }, []);

  // Silent background refresh that NEVER flips authLoading to true,
  // preventing visual flickers or loading screens during active sessions.
  const silentRefresh = useCallback(async () => {
    const token = localStorage.getItem("learnhub_token");
    if (!token) return;

    try {
      const res = await authService.getMe();
      if (res?.data?.user) {
        setUser(res.data.user);
        if (res.data.expiresAt) {
          setTokenExpiry(res.data.expiresAt);
        }
      }
    } catch {
      // Non-fatal background sync; api.js handles 401 token expiry
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Listen for auth logout events from API or other tabs
  useEffect(() => {
    const handleAuthLogout = () => {
      localStorage.removeItem("learnhub_token");
      setUser(null);
      setTokenExpiry(null);
      setAuthLoading(false);
    };
    window.addEventListener("auth logout", handleAuthLogout);
    return () => window.removeEventListener("auth logout", handleAuthLogout);
  }, []);

  // Proactive token refresh with safe 32-bit integer timeout clamping.
  // Standard 32-bit signed int max is 2,147,483,647ms (~24.8 days).
  // Delays larger than that cause browser setTimeout overflow (fires immediately in a 1ms loop).
  const MAX_SAFE_TIMEOUT_MS = 2147483647;
  useEffect(() => {
    if (!tokenExpiry || !user) return;

    const expiryTime = new Date(tokenExpiry).getTime();
    if (isNaN(expiryTime)) return;

    const timeUntilExpiry = expiryTime - Date.now();

    // If token has already expired, log out cleanly instead of looping
    if (timeUntilExpiry <= 0) {
      localStorage.removeItem("learnhub_token");
      setUser(null);
      setTokenExpiry(null);
      setAuthLoading(false);
      return;
    }

    // Refresh 5 minutes before expiry, with a minimum delay of 60 seconds
    // and clamped to MAX_SAFE_TIMEOUT_MS to prevent browser integer overflow.
    const refreshIn = Math.min(
      Math.max(timeUntilExpiry - 5 * 60 * 1000, 60000),
      MAX_SAFE_TIMEOUT_MS
    );

    const timer = setTimeout(silentRefresh, refreshIn);
    return () => clearTimeout(timer);
  }, [tokenExpiry, user, silentRefresh]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authService.login({ email, password });
      localStorage.setItem("learnhub_token", res.data.token);
      setUser(res.data.user);
      if (res.data.expiresAt) {
        setTokenExpiry(res.data.expiresAt);
      }
      setAuthLoading(false);
      return res;
    } catch (err) {
      setUser(null);
      setAuthLoading(false);
      setError(err.message || "Login failed");
      toast.error(getLoginErrorMessage(err));
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await authService.register({ name, email, password });
      localStorage.setItem("learnhub_token", res.data.token);
      setUser(res.data.user);
      if (res.data.expiresAt) {
        setTokenExpiry(res.data.expiresAt);
      }
      setAuthLoading(false);
      toast.success("Account created!");
      return res;
    } catch (err) {
      setUser(null);
      setAuthLoading(false);
      setError(err.message || "Registration failed");
      toast.error(getRegistrationErrorMessage(err));
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("learnhub_token");
    setUser(null);
    setTokenExpiry(null);
    setAuthLoading(false);
    window.dispatchEvent(new Event("auth logout"));
  };

  const clearError = () => setError(null);

  const isAdmin = user?.role === "admin";
  const loading = authLoading;
  const isAuthenticated = Boolean(user);
  const isUnauthenticated = !user && !authLoading;
  const state = authLoading
    ? authStates.INITIALIZING
    : user
    ? authStates.AUTHENTICATED
    : authStates.UNAUTHENTICATED;

  const refreshUser = useCallback(() => {
    return silentRefresh();
  }, [silentRefresh]);

  function getLoginErrorMessage(err) {
    if (!err) return "Login failed";
    const msg = err.message || "";
    if (msg.includes("Invalid credentials")) return "Incorrect email or password.";
    if (msg.includes("expired")) return "Your session has expired. Please sign in again.";
    if (msg.includes("network")) return "Unable to connect. Please check your internet connection.";
    return msg;
  }

  function getRegistrationErrorMessage(err) {
    if (!err) return "Registration failed";
    const msg = err.message || "";
    if (msg.includes("already")) return "An account with this email already exists.";
    if (msg.includes("network")) return "Unable to connect. Please check your internet connection.";
    return msg;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        state,
        loading,
        authLoading,
        isAuthenticated,
        isUnauthenticated,
        login,
        register,
        logout,
        isAdmin,
        refreshUser,
        tokenExpiry,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}