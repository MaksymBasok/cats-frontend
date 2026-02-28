"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ContainerDto } from "@/shared/types";

interface ContainerTableProps {
  containers: ContainerDto[];
}

export function ContainerTable({ containers }: ContainerTableProps) {
  const router = useRouter();

  return (
    <div className="stylish-card overflow-hidden rounded-[28px] border border-primary/10 bg-card/80">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-background/70 text-left">
              <th className="px-5 py-4 font-medium text-muted-foreground">Код</th>
              <th className="px-5 py-4 font-medium text-muted-foreground">Назва</th>
              <th className="px-5 py-4 font-medium text-muted-foreground">Тип</th>
              <th className="px-5 py-4 font-medium text-muted-foreground">Об’єм</th>
              <th className="px-5 py-4 font-medium text-muted-foreground">Статус</th>
              <th className="px-5 py-4 font-medium text-muted-foreground">Продукт</th>
              <th className="px-5 py-4 font-medium text-muted-foreground">Дата виробництва</th>
              <th className="px-5 py-4 font-medium text-muted-foreground">Термін</th>
            </tr>
          </thead>

          <tbody>
            {containers.map((c) => {
              const isFull = c.status === "Full";
              const containerHref = c.code ? `/containers/${encodeURIComponent(c.code)}` : null;

              const product = isFull ? c.currentProductName : null;
              const prodDate = isFull ? c.currentProductionDate : null;
              const expDate = isFull ? c.currentExpirationDate : null;

              return (
                <tr
                  key={c.id}
                  onClick={() => {
                    if (containerHref) {
                      router.push(containerHref);
                    }
                  }}
                  className={`border-b border-border/60 transition-colors last:border-b-0 ${
                    containerHref ? "cursor-pointer hover:bg-primary/5" : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    {containerHref ? (
                      <Link href={containerHref} className="font-semibold text-primary transition-colors hover:text-primary/80">
                        {c.code}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-foreground">{c.name ?? "-"}</td>
                  <td className="px-5 py-4 text-muted-foreground">{c.containerTypeName ?? "-"}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {c.volume} {c.unit ?? ""}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isFull
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {isFull ? "Заповнена" : "Порожня"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-foreground">{product ?? "-"}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {prodDate ? new Date(prodDate).toLocaleDateString("uk-UA") : "-"}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {expDate ? new Date(expDate).toLocaleDateString("uk-UA") : "-"}
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
