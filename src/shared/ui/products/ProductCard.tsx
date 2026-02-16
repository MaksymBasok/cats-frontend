// src/shared/ui/products/ProductCard.tsx
"use client";

import type { ProductDto } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Package, Clock, CalendarDays, Pencil, Trash2 } from "lucide-react";

export function ProductCard({
  product,
  isAdmin,
  onEdit,
  onDelete,
}: {
  product: ProductDto;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const days = product.shelfLifeDays != null ? product.shelfLifeDays : null;
  const hours = product.shelfLifeHours != null ? product.shelfLifeHours : null;

  const shelfLabel =
    days != null && hours != null
      ? `${days} дн • ${hours} год`
      : days != null
        ? `${days} дн`
        : hours != null
          ? `${hours} год`
          : null;

  const hasShelf = shelfLabel != null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-brand-navy/20 hover:shadow-sm active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Package className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-card-foreground">
              {product.name ?? "—"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {product.productTypeName ?? "—"}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            hasShelf ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
          }`}
        >
          {hasShelf ? `Термін: ${shelfLabel}` : "Термін: —"}
        </span>
      </div>

      {product.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {days != null && (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {days} днів
          </span>
        )}
        {hours != null && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {hours} годин
          </span>
        )}
      </div>

      {isAdmin && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit} className="flex-1">
            <Pencil className="mr-2 h-4 w-4" />
            Редагувати
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete} className="flex-1">
            <Trash2 className="mr-2 h-4 w-4" />
            Видалити
          </Button>
        </div>
      )}
    </div>
  );
}
