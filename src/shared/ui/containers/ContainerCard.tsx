"use client";

import Link from "next/link";
import type { ContainerDto } from "@/shared/types";
import { Box, Droplets, Calendar } from "lucide-react";

interface ContainerCardProps {
  container: ContainerDto;
}

export function ContainerCard({ container }: ContainerCardProps) {
  const isFull = container.status === "Full";
  const containerHref = container.code ? `/containers/${encodeURIComponent(container.code)}` : null;

  const productName = isFull ? container.currentProductName : null;
  const prodDate = isFull ? container.currentProductionDate : null;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors ${
              isFull
                ? "bg-emerald-500/10 text-emerald-600 shadow-[0_10px_24px_rgba(16,185,129,0.12)] dark:text-emerald-400"
                : "bg-primary/10 text-primary shadow-[var(--neon-glow)]"
            }`}
          >
            {isFull ? <Droplets className="h-5 w-5" /> : <Box className="h-5 w-5" />}
          </div>

          <div>
            <p className="text-base font-semibold text-card-foreground transition-colors group-hover:text-primary">
              {container.code ?? "-"}
            </p>
            <p className="text-xs text-muted-foreground">{container.name ?? "-"}</p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isFull
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300"
          }`}
        >
          {isFull ? "Заповнена" : "Порожня"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background/60 px-2.5 py-1 font-medium text-muted-foreground">
          {container.containerTypeName ?? "-"}
        </span>

        <span className="text-muted-foreground">
          {container.volume} {container.unit ?? ""}
        </span>

        {productName ? (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">{productName}</span>
        ) : null}

        {prodDate ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(prodDate).toLocaleDateString("uk-UA")}
          </span>
        ) : null}
      </div>
    </>
  );

  if (!containerHref) {
    return <div className="stylish-card group rounded-[24px] border border-primary/10 p-4">{content}</div>;
  }

  return (
    <Link
      href={containerHref}
      className="stylish-card group block rounded-[24px] border border-primary/10 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20"
    >
      {content}
    </Link>
  );
}
