"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, CircleX, Loader2 } from "lucide-react";
import { verifyInvitation } from "@/shared/api/invitations";

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
    <div className="mx-auto w-full max-w-md animate-fade-in-up">
      <div className="glass overflow-hidden rounded-[32px] border border-primary/12 shadow-[var(--luxury-shadow-hover)]">
        <div className="relative px-8 pb-8 pt-10">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
          </div>

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
                  description="Усе гаразд. Тепер можна увійти в систему через Google."
                  action={
                    <Link href="/login" className="inline-flex">
                      <span className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--luxury-shadow)]">
                        Перейти до входу
                      </span>
                    </Link>
                  }
                />
              ) : null}

              {status === "error" ? <ErrorState /> : null}
            </>
          ) : (
            <ErrorState />
          )}
        </div>
      </div>
    </div>
  );
}

function StateBlock({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center gap-5 text-center">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-3xl bg-background/70">
        {icon}
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action ?? (
        <Link href="/login" className="inline-flex">
          <span className="inline-flex h-11 items-center justify-center rounded-2xl border border-border/70 bg-background/70 px-5 text-sm font-semibold">
            До входу
          </span>
        </Link>
      )}
    </div>
  );
}

function ErrorState() {
  return (
    <StateBlock
      icon={<CircleX className="h-10 w-10 text-destructive" />}
      title="Запрошення недійсне"
      description="Термін дії запрошення минув або саме посилання некоректне."
    />
  );
}
