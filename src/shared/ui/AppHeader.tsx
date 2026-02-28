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

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      const element = menuRef.current;
      if (!element) return;
      if (!element.contains(event.target as Node)) setProfileOpen(false);
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
      <header className="sticky top-0 z-30 border-b border-primary/10 bg-background/70 backdrop-blur-xl">
        <div className="flex min-h-16 items-center gap-3 px-4 md:px-6 xl:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Link
              href="/"
              className="cats-logo-wrap flex items-center gap-3 rounded-2xl px-3 py-2 text-left transition-all hover:-translate-y-0.5 md:hidden"
            >
              <div className="rounded-xl bg-gradient-to-br from-[#0891b2] to-[#22d3ee] p-1.5 shadow-md shadow-primary/20">
                <Image
                  src="/images/cats-logo.png"
                  alt="CATS"
                  width={32}
                  height={32}
                  className="cats-logo-glow h-8 w-8 object-contain"
                  quality={100}
                  priority
                />
              </div>
              <div className="hidden text-left sm:block">
                <span className="block text-lg font-bold tracking-tight gradient-text-animated">CATS</span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Tracking System
                </span>
              </div>
            </Link>

            <div className="hidden min-w-0 flex-1 md:block">
              <Breadcrumbs />
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              aria-label={theme === "light" ? "Увімкнути темну тему" : "Увімкнути світлу тему"}
              type="button"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <Button onClick={() => setScanOpen(true)} type="button" className="gap-2">
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Сканувати</span>
            </Button>

            <div className="relative" ref={menuRef}>
              <Button
                onClick={() => setProfileOpen((value) => !value)}
                variant="outline"
                className="h-10 gap-2 rounded-2xl px-2.5"
                aria-label="Меню профілю"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                type="button"
              >
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt="Аватар"
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {userInitials}
                  </div>
                )}
                <span className="hidden max-w-[140px] truncate sm:inline">
                  {user?.firstName || user?.email || "Користувач"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>

              {profileOpen ? (
                <div
                  className="glass absolute right-0 top-full z-50 mt-2 w-60 rounded-3xl p-2 shadow-[var(--luxury-shadow-hover)]"
                  role="menu"
                >
                  <div className="border-b border-border/70 px-3 py-3">
                    <p className="truncate text-sm font-semibold text-card-foreground">
                      {(user?.firstName || user?.lastName)
                        ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
                        : "Користувач"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
                    <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {roleName}
                    </span>
                  </div>

                  <Button asChild type="button" variant="ghost" className="mt-2 w-full justify-start gap-2 rounded-2xl">
                    <Link href="/profile" role="menuitem">
                      <UserCircle className="h-4 w-4" />
                      Профіль
                    </Link>
                  </Button>

                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full justify-start gap-2 rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                    role="menuitem"
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    Вийти
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="px-4 pb-3 md:hidden">
          <Breadcrumbs />
        </div>
      </header>

      <QrScannerModal open={scanOpen} onClose={() => setScanOpen(false)} />
    </>
  );
}
