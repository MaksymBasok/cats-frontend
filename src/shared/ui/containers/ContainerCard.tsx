// src/shared/ui/containers/ContainerCard.tsx
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
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
              isFull 
                ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" 
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isFull ? <Droplets className="h-5 w-5" /> : <Box className="h-5 w-5" />}
          </div>

          <div>
            <p className="text-base font-semibold text-card-foreground group-hover:text-primary transition-colors">{container.code ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{container.name ?? "—"}</p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            isFull 
              ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isFull ? "Заповнена" : "Порожня"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-medium text-muted-foreground">
          {container.containerTypeName ?? "—"}
        </span>
        <span className="text-muted-foreground">
          {container.volume} {container.unit ?? ""}
        </span>

        {productName && (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">{productName}</span>
        )}

        {prodDate && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(prodDate).toLocaleDateString("uk-UA")}
          </span>
        )}
      </div>
    </>
  );

  if (!containerHref) {
    return (
      <div className="group block rounded-xl border border-border bg-card p-4">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={containerHref}
      className="group block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
    >
      {content}
    </Link>
  );
}
