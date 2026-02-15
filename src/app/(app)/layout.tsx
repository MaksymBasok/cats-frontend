"use client";

import { AuthGuard } from "@/shared/auth/guard";
import { AppHeader } from "@/shared/ui/AppHeader";
import { Sidebar } from "@/shared/ui/Sidebar";
import { BottomNav } from "@/shared/ui/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-4 py-4 pb-20 md:pb-4">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
