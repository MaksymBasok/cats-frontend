"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/auth/AuthProvider";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PendingPage() {
  const { logout, refreshProfile } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleRetry = async () => {
    setChecking(true);
    try {
      await refreshProfile();
      toast.success("Перевірено! Перенаправляємо...");
      router.push("/");
    } catch {
      toast.error("Обліковий запис ще не активовано");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/images/cats-logo.png"
            alt="CATS"
            width={64}
            height={64}
            className="rounded-xl"
          />

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange/10">
            <Clock className="h-7 w-7 text-brand-orange" />
          </div>

          <div className="text-center">
            <h1 className="text-lg font-semibold text-card-foreground">
              Очікування підтвердження
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Ваш обліковий запис очікує підтвердження від адміністратора.
              Ви отримаєте доступ після активації.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 mt-2">
            <button
              onClick={handleRetry}
              disabled={checking}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
              {checking ? "Перевіряємо..." : "Перевірити статус"}
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Вийти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
