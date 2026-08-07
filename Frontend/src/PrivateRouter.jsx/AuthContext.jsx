// AuthContext.jsx
import React, { createContext, useEffect, useState, useCallback } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  // ── Initialize from localStorage on first mount ──────────────────────────
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      if (token && userData) {
        setUserState(JSON.parse(userData));
      } else {
        setUserState(null);
      }
    } catch (error) {
      console.error("Error loading user from localStorage:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Persist user to localStorage whenever it changes ─────────────────────
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      // Clear both token AND user when user becomes null
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [user]);

  // ── Public helpers ────────────────────────────────────────────────────────
  /** Call after a successful API login/register to store credentials. */
  const login = useCallback((userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUserState(userData);
  }, []);

  /** Call to log the user out and clear all stored credentials. */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserState(null);
  }, []);

  /** Legacy setter kept for components that call setUser directly. */
  const setUser = useCallback((userData) => {
    setUserState(userData);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, logout, loading, loginOpen, setLoginOpen }}
    >
      {children}
    </AuthContext.Provider>
  );
};
