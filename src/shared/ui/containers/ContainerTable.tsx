// src/shared/ui/containers/ContainerTable.tsx
"use client";

import Link from "next/link";
import type { ContainerDto } from "@/shared/types";

interface ContainerTableProps {
  containers: ContainerDto[];
}

export function ContainerTable({ containers }: ContainerTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Код</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Назва</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Тип</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{"Об'єм"}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Продукт</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Дата виробництва</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Термін</th>
            </tr>
          </thead>

          <tbody>
            {containers.map((c) => {
              const isFull = c.status === "Full";

              const product = isFull ? c.currentProductName : null;
              const prodDate = isFull ? c.currentProductionDate : null;
              const expDate = isFull ? c.currentExpirationDate : null;

              return (
                <tr
                  key={c.id}
                  className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/containers/${c.code ?? ""}`}
                      className="font-medium text-brand-navy hover:underline"
                    >
                      {c.code ?? "—"}
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-foreground">{c.name ?? "—"}</td>

                  <td className="px-4 py-3 text-muted-foreground">{c.containerTypeName ?? "—"}</td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {c.volume} {c.unit ?? ""}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        isFull ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isFull ? "Заповнена" : "Порожня"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-foreground">{product ?? "—"}</td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {prodDate ? new Date(prodDate).toLocaleDateString("uk-UA") : "—"}
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {expDate ? new Date(expDate).toLocaleDateString("uk-UA") : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
