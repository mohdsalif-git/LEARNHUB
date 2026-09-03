import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("learnhub_token");
    if (token) {
      try {
        const res = await authService.getMe();
        setUser(res.data.user);
        if (res.data.expiresAt) {
          setTokenExpiry(res.data.expiresAt);
        }
      } catch (err) {
        localStorage.removeItem("learnhub_token");
        setUser(null);
        setTokenExpiry(null);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Listen for auth logout events from API
  useEffect(() => {
    const handleAuthLogout = (e) => {
      localStorage.removeItem("learnhub_token");
      setUser(null);
      setTokenExpiry(null);
    };
    window.addEventListener("auth logout", handleAuthLogout);
    return () => window.removeEventListener("auth logout", handleAuthLogout);
  }, []);

  // Refresh token if approaching expiry
  useEffect(() => {
    if (tokenExpiry) {
      const timeUntilExpiry = new Date(tokenExpiry) - Date.now();
      const refreshTimeout = setTimeout(fetchUser, Math.max(timeUntilExpiry - 5 * 60 * 1000, 0));
      return () => clearTimeout(refreshTimeout);
    }
  }, [tokenExpiry, fetchUser]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    localStorage.setItem("learnhub_token", res.data.token);
    setUser(res.data.user);
    if (res.data.expiresAt) {
      setTokenExpiry(res.data.expiresAt);
    }
    return res;
  };

  const googleLogin = async (credential) => {
    setIsGoogleLoading(true);
    try {
      const res = await authService.googleLogin(credential);
      localStorage.setItem("learnhub_token", res.data.token);
      setUser(res.data.user);
      if (res.data.expiresAt) {
        setTokenExpiry(res.data.expiresAt);
      }
      return res;
    } catch (err) {
      toast.error(err.message || "Google login failed");
      throw err;
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const register = async (name, email, password) => {
    const res = await authService.register({ name, email, password });
    localStorage.setItem("learnhub_token", res.data.token);
    setUser(res.data.user);
    if (res.data.expiresAt) {
      setTokenExpiry(res.data.expiresAt);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem("learnhub_token");
    setUser(null);
    setTokenExpiry(null);
    window.dispatchEvent(new Event("auth logout"));
  };

  const isAdmin = user?.role === "admin";

  const refreshUser = () => fetchUser();

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, googleLogin, logout, isAdmin, refreshUser, tokenExpiry, isGoogleLoading }}
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