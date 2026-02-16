// src/shared/ui/products/ProductsTable.tsx
"use client";

import Link from "next/link";
import type { ProductDto } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export function ProductsTable({
  products,
  isAdmin,
  onEdit,
  onDelete,
}: {
  products: ProductDto[];
  isAdmin: boolean;
  onEdit: (p: ProductDto) => void;
  onDelete: (p: ProductDto) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Назва</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Тип</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Термін</th>
              {isAdmin && (
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Дії</th>
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const days = p.shelfLifeDays != null ? `${p.shelfLifeDays} дн.` : null;
              const hours = p.shelfLifeHours != null ? `${p.shelfLifeHours} год.` : null;
              const shelf = [days, hours].filter(Boolean).join(" • ") || "—";

              return (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{p.name ?? "—"}</div>
                    {p.description ? (
                      <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {p.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.productTypeName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{shelf}</td>

                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEdit(p)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Редагувати
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(p)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Видалити
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
