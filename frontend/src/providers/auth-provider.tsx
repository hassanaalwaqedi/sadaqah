"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  email_verified: boolean;
  is_active: boolean;
  profile?: {
    first_name_en: string;
    last_name_en: string;
    first_name_ar?: string;
    last_name_ar?: string;
    university?: string;
    major?: string;
    gpa?: number;
  };
  roles?: Array<{
    id: string;
    name: string;
    display_name_en: string;
    display_name_ar: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
}

interface RegisterData {
  email: string;
  password: string;
  first_name_en: string;
  last_name_en: string;
  first_name_ar?: string;
  last_name_ar?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await apiClient.get("/users/me");
      setUser(response.data);
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post("/auth/login", { email, password });
    const { access_token, user: userData } = response.data;

    localStorage.setItem("access_token", access_token);
    if (response.data.refresh_token) {
      localStorage.setItem("refresh_token", response.data.refresh_token);
    }

    setUser(userData);
  };

  const register = async (data: RegisterData) => {
    const response = await apiClient.post("/auth/register", data);
    const { access_token, user: userData } = response.data;

    localStorage.setItem("access_token", access_token);
    if (response.data.refresh_token) {
      localStorage.setItem("refresh_token", response.data.refresh_token);
    }

    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore errors during logout
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.some((r) => r.name === role) ?? false;
  };

  const hasAnyRole = (...roles: string[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
