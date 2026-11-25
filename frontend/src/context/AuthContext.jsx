import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("auth_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, []);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          localStorage.setItem("auth_user", JSON.stringify(profile));
        } catch (err) {
          setToken(null);
          setUser(null);
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    localStorage.setItem("auth_token", res.access_token);
    localStorage.setItem("auth_user", JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (email, password, name, preferred_language = "en") => {
    const res = await authService.register({ email, password, name, preferred_language });
    localStorage.setItem("auth_token", res.access_token);
    localStorage.setItem("auth_user", JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedProfile) => {
    setUser(updatedProfile);
    localStorage.setItem("auth_user", JSON.stringify(updatedProfile));
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, isAuthenticated: !!token, login, register, logout, updateUser }}>
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
