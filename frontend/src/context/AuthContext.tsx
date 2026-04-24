"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, tokenStore, UserProfile } from "@/lib/api";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  unit?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    unit?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toUser = (profile: UserProfile): User => ({
  id: profile.id,
  email: profile.email,
  fullName: profile.full_name,
  role: profile.role,
  unit: profile.unit ?? undefined,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setIsLoading(false);
      return;
    }
    try {
      const profile = await api.auth.me();
      setUser(toUser(profile));
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const tokens = await api.auth.login(email, password);
      tokenStore.set(tokens.access_token, tokens.refresh_token);
      const profile = await api.auth.me();
      setUser(toUser(profile));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    unit?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.auth.register(payload);
      await login(payload.email, payload.password);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Registration failed";
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore server errors; we still clear local state
    }
    tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
