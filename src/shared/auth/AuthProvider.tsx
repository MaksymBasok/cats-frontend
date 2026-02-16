// src/shared/auth/AuthProvider.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearAccessToken, getAccessToken, setAccessToken } from "./token";
import { getProfile } from "@/shared/api/users";
import type { UserDto } from "@/shared/types";

interface AuthContextValue {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPending: boolean;

  /**
   * Set backend access token and fetch profile
   */
  login: (token: string) => Promise<UserDto>;

  /**
   * Clears local token & user
   */
  logout: (opts?: { redirectToLogin?: boolean }) => void;

  /**
   * Refetch /profile
   */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Extract token from URL after OAuth redirect.
 * Supports: ?token=, ?access_token=, ?jwt=
 */
function pickTokenFromSearch(params: URLSearchParams): string | null {
  const candidates = ["token", "access_token", "jwt"];
  for (const key of candidates) {
    const v = params.get(key);
    if (v && v.trim()) return v.trim();
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
      return profile;
    } catch {
      clearAccessToken();
      setUser(null);
      return null;
    }
  }, []);

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1) normal case: token already in storage
      const stored = getAccessToken();
      if (stored) {
        await fetchProfile();
        return;
      }

      // 2) oauth redirect case: token in query string
      // NOTE: backend (or your auth flow) must actually put token into query
      const tokenFromUrl = pickTokenFromSearch(searchParams);
      if (tokenFromUrl) {
        setAccessToken(tokenFromUrl);
        // remove token from URL (avoid leaking via screenshots/history)
        const url = new URL(window.location.href);
        ["token", "access_token", "jwt"].forEach((k) => url.searchParams.delete(k));
        window.history.replaceState({}, "", url.toString());

        await fetchProfile();
        return;
      }

      // 3) no token -> not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, searchParams]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (token: string) => {
    setAccessToken(token);
    setIsLoading(true);
    try {
      const profile = await getProfile();
      setUser(profile);
      return profile;
    } catch (err) {
      clearAccessToken();
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(
    (opts?: { redirectToLogin?: boolean }) => {
      clearAccessToken();
      setUser(null);
      if (opts?.redirectToLogin) router.replace("/login");
    },
    [router]
  );

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchProfile();
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const isAdmin = useMemo(() => user?.role === "Admin", [user]);
  const isPending = useMemo(() => !!user && !user.isActive, [user]);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin,
      isPending,
      login,
      logout,
      refreshProfile,
    }),
    [user, isLoading, isAdmin, isPending, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
