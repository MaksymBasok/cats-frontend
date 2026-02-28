"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, CircleX, Loader2, MailCheck } from "lucide-react";
import { verifyInvitation } from "@/shared/api/invitations";
import { Button } from "@/components/ui/button";

export default function VerifyInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    if (!token) return;

    verifyInvitation(token)
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="mx-auto w-full max-w-[520px] animate-fade-in-up">
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
              <MailCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Запрошення</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">Перевірка доступу до системи</h1>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Система перевіряє дійсність запрошення і відразу підкаже наступний крок.
            </p>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-background/65 p-5">
            {token ? (
              <>
                {status === "loading" ? (
                  <StateBlock
                    icon={<Loader2 className="h-10 w-10 animate-spin text-primary" />}
                    title="Перевіряємо запрошення"
                    description="Зачекайте кілька секунд, поки система перевірить дійсність токена."
                  />
                ) : null}

                {status === "ok" ? (
                  <StateBlock
                    icon={<CheckCircle2 className="h-10 w-10 text-emerald-500" />}
                    title="Запрошення дійсне"
                    description="Усе гаразд. Тепер можна перейти до входу через Google."
                  />
                ) : null}

                {status === "error" ? (
                  <StateBlock
                    icon={<CircleX className="h-10 w-10 text-destructive" />}
                    title="Запрошення недійсне"
                    description="Термін дії запрошення минув або саме посилання некоректне."
                  />
                ) : null}
              </>
            ) : (
              <StateBlock
                icon={<CircleX className="h-10 w-10 text-destructive" />}
                title="Запрошення недійсне"
                description="Посилання на запрошення відсутнє або пошкоджене."
              />
            )}
          </div>

          <Button asChild type="button" className="w-full">
            <Link href="/login">{status === "ok" ? "Перейти до входу" : "До входу"}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function StateBlock({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex flex-col items-start gap-5">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-3xl bg-background/70">
        {icon}
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
