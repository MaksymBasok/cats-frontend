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
    <div className="stylish-card rounded-[24px] border border-primary/10 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20 active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[var(--neon-glow)]">
            <Package className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-card-foreground">{product.name ?? "—"}</p>
            <p className="truncate text-xs text-muted-foreground">{product.productTypeName ?? "—"}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              hasShelf
                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border border-border/70 bg-background/70 text-muted-foreground"
            }`}
          >
            {hasShelf ? `Термін: ${shelfLabel}` : "Термін: —"}
          </span>

          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <Button size="icon" variant="outline" onClick={onEdit} aria-label="Редагувати продукт" className="h-8 w-8 rounded-xl">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="destructive" onClick={onDelete} aria-label="Видалити продукт" className="h-8 w-8 rounded-xl">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {product.description ? <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{product.description}</p> : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {days != null ? (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {days} днів
          </span>
        ) : null}
        {hours != null ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {hours} годин
          </span>
        ) : null}
      </div>
    </div>
  );
}
