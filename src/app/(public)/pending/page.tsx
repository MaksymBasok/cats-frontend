"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
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
    <div className="mx-auto w-full max-w-[520px] animate-fade-in-up">
      <section className="glass relative overflow-hidden rounded-[32px] border border-primary/12 p-8 shadow-[var(--luxury-shadow-hover)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-8">
          <div className="cats-logo-wrap mx-auto inline-flex w-fit items-center gap-3 rounded-[24px] px-4 py-3">
            <div className="rounded-2xl bg-gradient-to-br from-[#0891b2] to-[#22d3ee] p-2 shadow-md shadow-primary/20">
              <Image
                src="/images/cats-logo.png"
                alt="CATS"
                width={36}
                height={36}
                className="cats-logo-glow h-9 w-9 object-contain"
                quality={100}
                priority
              />
            </div>
            <div>
              <span className="block text-xl font-bold tracking-tight gradient-text-animated">CATS</span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Tracking System
              </span>
            </div>
          </div>

          <div className="space-y-3 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-[var(--neon-glow)]">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Статус доступу</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">Обліковий запис очікує активації</h1>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Після підтвердження адміністратором доступ до робочого простору відкриється автоматично.
            </p>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-background/65 p-5">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-600 dark:text-amber-300">
                <Clock className="h-5 w-5" />
              </div>
              <p>
                Якщо адміністратор уже активував ваш доступ, натисніть кнопку нижче, щоб повторно перевірити статус.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
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
      </section>
    </div>
  );
}
