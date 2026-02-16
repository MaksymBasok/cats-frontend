// src/shared/auth/guard.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";

/**
 * Guards:
 * - AuthGuard: requires authenticated + active user
 * - AdminGuard: requires admin role
 */

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in -> /login
    if (!isAuthenticated) {
      if (pathname !== "/login") router.replace("/login");
      return;
    }

    // Logged in but pending -> /pending
    if (user && user.isActive === false) {
      if (pathname !== "/pending") router.replace("/pending");
      return;
    }

    // If user is active and accidentally on /pending -> back to home
    if (user && user.isActive === true && pathname === "/pending") {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-navy" />
      </div>
    );
  }

  // While redirecting
  if (!isAuthenticated) return null;
  if (user && user.isActive === false) return null;

  return <>{children}</>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // If not authenticated, AuthGuard should handle it, but keep it safe
    if (!isAuthenticated) {
      if (pathname !== "/login") router.replace("/login");
      return;
    }

    // If pending, AuthGuard should handle it
    if (user && user.isActive === false) {
      if (pathname !== "/pending") router.replace("/pending");
      return;
    }

    if (!isAdmin) {
      router.replace("/");
    }
  }, [isAuthenticated, isAdmin, isLoading, user, router, pathname]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;
  if (user && user.isActive === false) return null;
  if (!isAdmin) return null;

  return <>{children}</>;
}
