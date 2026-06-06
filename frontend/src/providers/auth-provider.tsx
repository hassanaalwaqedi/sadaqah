"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  email_verified: boolean;
  is_active: boolean;
  profile_completed: boolean;
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
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
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
      const response = await apiClient.get("/users/me");
      setUser(response.data);
    } catch {
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
    const { user: userData } = response.data;
    setUser(userData);
  };

  const loginWithGoogle = async (idToken: string) => {
    const response = await apiClient.post("/auth/google", { id_token: idToken });
    const { user: userData } = response.data;
    setUser(userData);
  };

  const register = async (data: RegisterData) => {
    const response = await apiClient.post("/auth/register", data);
    const { user: userData } = response.data;
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore errors during logout
    } finally {
      setUser(null);
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.some((r) => r.name === role) ?? false;
  };

  const hasAnyRole = (...roles: string[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  const hasPermission = (permission: string): boolean => {
    // Super admin has all permissions
    if (hasRole("super_admin")) return true;
    return user?.permissions?.includes(permission) ?? false;
  };

  const hasAnyPermission = (...permissions: string[]): boolean => {
    if (hasRole("super_admin")) return true;
    return permissions.some((p) => user?.permissions?.includes(p)) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
        hasRole,
        hasAnyRole,
        hasPermission,
        hasAnyPermission,
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

