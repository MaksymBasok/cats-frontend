"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth/AuthProvider";
import { showErrorToast } from "@/shared/utils/errors";
import { Button } from "@/components/ui/button";

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
      const profile = await refreshProfile();
      if (profile?.isActive) {
        toast.success("Доступ підтверджено. Перенаправляємо...");
        router.push("/");
        return;
      }

      toast.error("Обліковий запис ще очікує підтвердження адміністратора.");
    } catch (error) {
      showErrorToast(error, "Не вдалося перевірити статус доступу");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md animate-fade-in-up">
      <div className="glass overflow-hidden rounded-[32px] border border-primary/12 shadow-[var(--luxury-shadow-hover)]">
        <div className="relative px-8 pb-8 pt-10">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center gap-5 text-center">
            <Image
              src="/images/cats-logo.png"
              alt="CATS"
              width={68}
              height={68}
              className="cats-logo-glow rounded-2xl"
            />

            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-400/10 text-amber-600 dark:text-amber-300">
              <Clock className="h-8 w-8" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Очікування підтвердження</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Ваш обліковий запис ще не активований. Після підтвердження адміністратором сторінка відкриє доступ автоматично.
              </p>
            </div>

            <div className="grid w-full gap-2">
              <Button onClick={handleRetry} disabled={checking} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                {checking ? "Перевіряємо..." : "Перевірити статус"}
              </Button>
              <Button onClick={handleLogout} variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                Вийти
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
