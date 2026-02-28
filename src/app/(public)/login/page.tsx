"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useCallback, useState } from "react";
import { AlertCircle, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth/AuthProvider";
import { Button } from "@/components/ui/button";
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

type GoogleState = "loading" | "ready" | "error";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [googleState, setGoogleState] = useState<GoogleState>("loading");
  const [googleRenderKey, setGoogleRenderKey] = useState(0);

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

  const renderGoogleButton = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const target = googleButtonRef.current;

    if (!clientId || !target || !window.google) return false;

    target.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    });
    window.google.accounts.id.renderButton(target, {
      theme: "outline",
      size: "large",
      width: Math.min(target.clientWidth || 360, 360),
      text: "signin_with",
      shape: "rectangular",
      locale: "uk",
    });

    return true;
  }, [handleCredentialResponse]);

  useEffect(() => {
    if (authLoading || loginLoading) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setGoogleState("error");
      return;
    }

    let cancelled = false;
    let pollId: number | null = null;
    let failId: number | null = null;

    const tryRender = () => {
      if (cancelled) return false;
      const ok = renderGoogleButton();
      if (ok) {
        setGoogleState("ready");
      }
      return ok;
    };

    setGoogleState("loading");

    if (tryRender()) {
      return () => {
        cancelled = true;
      };
    }

    const script = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    const onLoad = () => {
      void Promise.resolve().then(() => {
        tryRender();
      });
    };

    script?.addEventListener("load", onLoad);

    pollId = window.setInterval(() => {
      if (tryRender() && pollId != null) {
        window.clearInterval(pollId);
        pollId = null;
      }
    }, 200);

    failId = window.setTimeout(() => {
      if (!cancelled && !window.google) {
        setGoogleState("error");
      }
    }, 5000);

    return () => {
      cancelled = true;
      script?.removeEventListener("load", onLoad);
      if (pollId != null) window.clearInterval(pollId);
      if (failId != null) window.clearTimeout(failId);
    };
  }, [authLoading, loginLoading, renderGoogleButton, googleRenderKey]);

  if (authLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[460px] animate-fade-in-up">
      <section className="glass relative overflow-hidden rounded-[32px] border border-primary/12 p-8 shadow-[var(--luxury-shadow-hover)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
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
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Авторизація</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">Увійти в CATS</h1>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Продовжіть через Google, щоб відкрити робочий простір системи.
            </p>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-background/65 p-5">
            {loginLoading ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Виконуємо вхід...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex min-h-12 justify-center">
                  <div ref={googleButtonRef} className="w-full max-w-[360px]" />
                </div>

                {googleState === "loading" ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Завантажуємо кнопку авторизації...
                  </div>
                ) : null}

                {googleState === "error" ? (
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="space-y-3">
                        <p>Google sign-in не завантажився. Оновіть кнопку або перевірте блокування сторонніх скриптів.</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-2 border-amber-400/40 bg-transparent text-amber-700 hover:bg-amber-400/10 hover:text-amber-700 dark:text-amber-300"
                          onClick={() => setGoogleRenderKey((value) => value + 1)}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Спробувати ще раз
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
            <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
              `NEXT_PUBLIC_GOOGLE_CLIENT_ID` не налаштовано.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
