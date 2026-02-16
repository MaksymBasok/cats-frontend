// src/shared/ui/AppHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ScanLine, LogOut, UserCircle, ChevronDown, Moon, Sun } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthProvider";
import { useTheme } from "@/lib/ThemeProvider";
import { QrScannerModal } from "./QrScannerModal";
import { Breadcrumbs } from "./Breadcrumbs";

export function AppHeader() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [scanOpen, setScanOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const roleName = useMemo(() => (isAdmin ? "Адмін" : "Оператор"), [isAdmin]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    router.push("/login");
  };

  // Close profile menu on route change
  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  // Close profile menu on ESC / outside click
  useEffect(() => {
    if (!profileOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      const el = menuRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setProfileOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [profileOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/cats-logo.png"
                alt="CATS"
                width={32}
                height={32}
                className="rounded-md"
                priority
              />
              <span className="hidden text-lg font-semibold tracking-tight text-brand-navy sm:inline">
                CATS
              </span>
            </Link>

            <div className="ml-4 hidden min-w-0 md:block">
              <Breadcrumbs />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted transition-colors"
              aria-label={theme === "light" ? "Темна тема" : "Світла тема"}
              type="button"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setScanOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-2 text-sm font-medium text-brand-navy transition-colors hover:opacity-90"
              aria-label="Сканувати QR код"
              type="button"
            >
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Сканувати</span>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                aria-label="Меню профілю"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                type="button"
              >
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                <span className="hidden max-w-[140px] truncate sm:inline">
                  {user?.firstName || user?.email || ""}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-card p-2 shadow-lg"
                  role="menu"
                >
                  <div className="mb-1 border-b border-border px-3 py-2">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {(user?.firstName || user?.lastName)
                        ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
                        : "Користувач"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
                    <span className="mt-1 inline-block rounded-full bg-brand-navy/10 px-2 py-0.5 text-xs font-medium text-brand-navy">
                      {roleName}
                    </span>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    role="menuitem"
                  >
                    <UserCircle className="h-4 w-4" />
                    Профіль
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    role="menuitem"
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    Вийти
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 pb-2 md:hidden">
          <Breadcrumbs />
        </div>
      </header>

      <QrScannerModal open={scanOpen} onClose={() => setScanOpen(false)} />
    </>
  );
}
