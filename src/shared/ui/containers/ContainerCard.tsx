"use client";

import Link from "next/link";
import { ContainerStatus } from "@/shared/types";
import type { ContainerDto } from "@/shared/types";
import { Box, Droplets } from "lucide-react";

interface ContainerCardProps {
  container: ContainerDto;
}

export function ContainerCard({ container }: ContainerCardProps) {
  const isFull = container.status === ContainerStatus.Full;

  return (
    <Link
      href={`/containers/${container.code}`}
      className="block rounded-xl border border-border bg-card p-4 transition-all hover:border-brand-navy/20 hover:shadow-sm active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              isFull ? "bg-emerald-50 text-emerald-600" : "bg-muted text-muted-foreground"
            }`}
          >
            {isFull ? (
              <Droplets className="h-4 w-4" />
            ) : (
              <Box className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">
              {container.code}
            </p>
            <p className="text-xs text-muted-foreground">{container.name}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            isFull
              ? "bg-emerald-50 text-emerald-700"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isFull ? "Заповнена" : "Порожня"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{container.containerTypeName}</span>
        <span>
          {container.volume} {container.unit}
        </span>
        {isFull && container.currentFill && (
          <span className="text-emerald-700 font-medium">
            {container.currentFill.productName}
          </span>
        )}
      </div>
    </Link>
  );
}
