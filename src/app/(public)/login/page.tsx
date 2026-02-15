"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/shared/auth/AuthProvider";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
            }
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
        toast.success("Успішний вхід!");
        router.push("/");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Помилка входу";
        toast.error(message);
      } finally {
        setLoginLoading(false);
      }
    },
    [login, router]
  );

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return;

    function tryInit() {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current!, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "signin_with",
        shape: "rectangular",
        locale: "uk",
      });
    }

    tryInit();
    // If not loaded yet, wait for the script
    const timer = setInterval(() => {
      if (window.google) {
        tryInit();
        clearInterval(timer);
      }
    }, 200);

    return () => clearInterval(timer);
  }, [handleCredentialResponse]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-navy" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4 mb-8">
          <Image
            src="/images/cats-logo.png"
            alt="CATS - Container Audit Tracking System"
            width={80}
            height={80}
            className="rounded-xl"
            priority
          />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-card-foreground text-balance">
              Container Audit Tracking System
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Увійдіть для продовження
            </p>
          </div>
        </div>

        {loginLoading ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-6 w-6 animate-spin text-brand-navy" />
            <p className="text-sm text-muted-foreground">Входимо...</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div ref={googleButtonRef} />
          </div>
        )}

        {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <p className="mt-4 rounded-lg bg-brand-orange/10 px-3 py-2 text-center text-xs text-brand-orange">
            NEXT_PUBLIC_GOOGLE_CLIENT_ID не налаштовано
          </p>
        )}
      </div>
    </div>
  );
}
