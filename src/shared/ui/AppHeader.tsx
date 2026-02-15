"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, LogOut, UserCircle, ChevronDown } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthProvider";
import { UserRole } from "@/shared/types";
import { QrScannerModal } from "./QrScannerModal";
import { Breadcrumbs } from "./Breadcrumbs";

export function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [scanOpen, setScanOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const roleName = user?.role === UserRole.Admin ? "Адмін" : "Оператор";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/cats-logo.png"
                alt="CATS"
                width={32}
                height={32}
                className="rounded-md"
              />
              <span className="hidden text-lg font-semibold tracking-tight text-brand-navy sm:inline">
                CATS
              </span>
            </Link>
            <div className="hidden md:block ml-4">
              <Breadcrumbs />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScanOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-2 text-sm font-medium text-brand-navy transition-colors hover:opacity-90"
              aria-label="Сканувати QR код"
            >
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Сканувати</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                aria-label="Меню профілю"
              >
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {user?.firstName || user?.email || ""}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-card p-2 shadow-lg">
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                      <span className="mt-1 inline-block rounded-full bg-brand-navy/10 px-2 py-0.5 text-xs font-medium text-brand-navy">
                        {roleName}
                      </span>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <UserCircle className="h-4 w-4" />
                      Профіль
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Вийти
                    </button>
                  </div>
                </>
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
