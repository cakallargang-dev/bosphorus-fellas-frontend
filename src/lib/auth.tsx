"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User, LoginRequest, AuthState } from "@/types";
import { authApi } from "@/lib/api";

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    isAdmin: false,
  });

  const hydrate = useCallback(() => {
    try {
      const token = localStorage.getItem("mancave_token");
      const userStr = localStorage.getItem("mancave_user");
      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          isAdmin: user.role === "admin",
        });
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } catch {
      localStorage.removeItem("mancave_token");
      localStorage.removeItem("mancave_user");
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    const { token, user } = res.data;
    localStorage.setItem("mancave_token", token);
    localStorage.setItem("mancave_user", JSON.stringify(user));
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      isAdmin: user.role === "admin",
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mancave_token");
    localStorage.removeItem("mancave_user");
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authApi.getProfile();
      const user = res.data;
      localStorage.setItem("mancave_user", JSON.stringify(user));
      setState((s) => ({
        ...s,
        user,
        isAdmin: user.role === "admin",
      }));
    } catch {
      // silently fail - user may have been logged out
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
