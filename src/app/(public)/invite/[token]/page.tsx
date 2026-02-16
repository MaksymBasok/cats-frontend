"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { verifyInvitation } from "@/shared/api/invitations";
import { CheckCircle2, CircleX, Loader2 } from "lucide-react";

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

  if (!token) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-navy" />
          <p className="text-sm text-muted-foreground">Перевіряємо запрошення...</p>
        </div>
      )}

      {status === "ok" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
          <h1 className="text-lg font-semibold">Запрошення дійсне</h1>
          <p className="text-sm text-muted-foreground">Тепер ви можете увійти в систему через Google.</p>
          <Link href="/login" className="rounded-lg bg-brand-navy px-4 py-2 text-sm text-white">Перейти до входу</Link>
        </div>
      )}

      {status === "error" && <ErrorState />}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <CircleX className="h-9 w-9 text-destructive" />
      <h1 className="text-lg font-semibold">Запрошення недійсне</h1>
      <p className="text-sm text-muted-foreground">Термін дії запрошення вичерпано або токен некоректний.</p>
      <Link href="/login" className="rounded-lg border border-border px-4 py-2 text-sm">До входу</Link>
    </div>
  );
}
