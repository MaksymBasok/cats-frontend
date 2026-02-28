"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth/AuthProvider";
import { showErrorToast } from "@/shared/utils/errors";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setLoginLoading(true);
      try {
        const user = await login(response.credential);
        if (!user.isActive) {
          router.push("/pending");
          return;
        }
        toast.success("Успішний вхід");
        router.push("/");
      } catch (error) {
        showErrorToast(error, "Помилка входу");
      } finally {
        setLoginLoading(false);
      }
    },
    [login, router],
  );

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return;

    const tryInit = () => {
      if (!window.google || !googleButtonRef.current) return;
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "signin_with",
        shape: "rectangular",
        locale: "uk",
      });
    };

    tryInit();
    const failTimer = setTimeout(() => {
      if (!window.google) {
        toast.error("Вхід через Google не завантажився. Оновіть сторінку або перевірте блокувальники скриптів.");
      }
    }, 4000);

    const timer = setInterval(() => {
      if (window.google) {
        tryInit();
        clearInterval(timer);
      }
    }, 200);

    return () => {
      clearInterval(timer);
      clearTimeout(failTimer);
    };
  }, [handleCredentialResponse]);

  if (authLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md animate-fade-in-up">
      <div className="glass overflow-hidden rounded-[32px] border border-primary/12 shadow-[var(--luxury-shadow-hover)]">
        <div className="relative px-8 pb-8 pt-10">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center gap-5 text-center">
            <div className="cats-logo-wrap rounded-[26px] p-3 animate-pulse-glow">
              <Image
                src="/images/cats-logo.png"
                alt="CATS"
                width={84}
                height={84}
                className="cats-logo-glow rounded-2xl"
                priority
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                Container Tracking
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Система обліку тари</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Увійдіть через Google, щоб працювати з контейнерами, продуктами й технологічними датами.
              </p>
            </div>

            <div className="w-full rounded-[28px] border border-border/70 bg-background/60 p-5">
              {loginLoading ? (
                <div className="flex flex-col items-center gap-3 py-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Виконуємо вхід...</p>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div ref={googleButtonRef} />
                </div>
              )}
            </div>

            {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
              <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
                `NEXT_PUBLIC_GOOGLE_CLIENT_ID` не налаштовано.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
