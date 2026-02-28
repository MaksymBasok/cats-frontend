"use client";

import { AuthGuard } from "@/shared/auth/guard";
import { AppHeader } from "@/shared/ui/AppHeader";
import { Sidebar } from "@/shared/ui/Sidebar";
import { BottomNav } from "@/shared/ui/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="mesh-bg relative flex min-h-screen flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-primary/10 blur-[120px] animate-float" />
          <div className="absolute -left-24 bottom-16 h-80 w-80 rounded-full bg-cyan-400/10 blur-[140px] animate-float-reverse" />
        </div>

        <div className="relative z-10 flex min-h-0 flex-1">
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader />

            <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 md:px-6 md:pb-6 xl:px-8">
              <div className="mx-auto w-full max-w-[1600px]">{children}</div>
            </main>
          </div>
        </div>

        <BottomNav />
      </div>
    </AuthGuard>
  );
}
