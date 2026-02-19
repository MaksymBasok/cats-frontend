// src/shared/ui/AppHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, LogOut, UserCircle, ChevronDown, Moon, Sun } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthProvider";
import { useTheme } from "@/lib/ThemeProvider";
import { Button } from "@/components/ui/button";
import { QrScannerModal } from "./QrScannerModal";
import { Breadcrumbs } from "./Breadcrumbs";

export function AppHeader() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [scanOpen, setScanOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const roleName = useMemo(() => (isAdmin ? "Адміністратор" : "Оператор"), [isAdmin]);
  const userAvatar = useMemo(() => {
    const extended = user as (typeof user & {
      avatarUrl?: string | null;
      picture?: string | null;
      imageUrl?: string | null;
    }) | null;
    return extended?.avatarUrl || extended?.picture || extended?.imageUrl || null;
  }, [user]);

  const userInitials = useMemo(() => {
    const first = (user?.firstName ?? "").trim();
    const last = (user?.lastName ?? "").trim();
    if (first || last) return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "К";
    const mail = (user?.email ?? "").trim();
    return mail ? mail[0].toUpperCase() : "К";
  }, [user?.email, user?.firstName, user?.lastName]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    router.push("/login");
  };

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
            <Link href="/" className="cats-logo-wrap flex items-center gap-2 rounded-xl px-1.5 py-1 transition-all hover:-translate-y-0.5">
              <Image
                src="/images/cats-logo.png"
                alt="CATS"
                width={32}
                height={32}
                className="cats-logo-glow h-auto w-auto rounded-md"
                quality={100}
                priority
              />
              <span className="hidden text-lg font-semibold tracking-tight text-brand-navy dark:text-brand-orange sm:inline">
                CATS
              </span>
            </Link>

            <div className="ml-4 hidden min-w-0 md:block">
              <Breadcrumbs />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border-border/60 bg-background/70 text-foreground transition-all hover:-translate-y-0.5 hover:bg-muted"
              aria-label={theme === "light" ? "Увімкнути темну тему" : "Увімкнути світлу тему"}
              type="button"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <Button
              onClick={() => setScanOpen(true)}
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-lg bg-gradient-to-r from-brand-orange to-amber-300 text-sm font-semibold text-brand-navy shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-brand-orange hover:to-amber-300 hover:shadow"
              aria-label="Сканувати QR-код"
              type="button"
            >
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Сканувати</span>
            </Button>

            <div className="relative" ref={menuRef}>
              <Button
                onClick={() => setProfileOpen((v) => !v)}
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 rounded-lg px-2 text-sm text-foreground transition-colors hover:bg-muted"
                aria-label="Меню профілю"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                type="button"
              >
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt="Аватар"
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {userInitials}
                  </div>
                )}
                <span className="hidden max-w-[140px] truncate sm:inline">
                  {user?.firstName || user?.email || ""}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>

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
                    <span className="mt-1 inline-block rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                      {roleName}
                    </span>
                  </div>

                  <Button asChild type="button" variant="ghost" className="w-full justify-start gap-2 rounded-lg px-3 py-2 text-sm">
                    <Link href="/profile" role="menuitem">
                      <UserCircle className="h-4 w-4" />
                      Профіль
                    </Link>
                  </Button>

                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full justify-start gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                    role="menuitem"
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    Вийти
                  </Button>
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
