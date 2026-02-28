"use client";

import { useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
  ContainerStatus,
  ContainerTypeDto,
  ProductTypeDto,
  SearchContainersParams,
} from "@/shared/types";

interface ContainerFiltersProps {
  filters: SearchContainersParams;
  onChange: (filters: SearchContainersParams) => void;
  containerTypes: ContainerTypeDto[];
  productTypes: ProductTypeDto[];
}

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toIsoStartOfDay(dateValue: string): string | undefined {
  if (!dateValue) return undefined;
  return `${dateValue}T00:00:00.000Z`;
}

function fromIsoToDateInput(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function toNumberOrUndefined(v: string): number | undefined {
  if (!v || v === "all") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function ContainerFilters({
  filters,
  onChange,
  containerTypes,
  productTypes,
}: ContainerFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const update = (patch: Partial<SearchContainersParams>) => {
    onChange({ ...filters, ...patch });
  };

  const filledTodayChecked = useMemo(() => Boolean(filters.filledToday), [filters.filledToday]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.containerTypeId != null ||
      filters.status != null ||
      Boolean(filters.productionDate) ||
      filters.currentProductTypeId != null ||
      Boolean(filters.showExpired) ||
      Boolean(filters.filledToday)
    );
  }, [
    filters.containerTypeId,
    filters.status,
    filters.productionDate,
    filters.currentProductTypeId,
    filters.showExpired,
    filters.filledToday,
  ]);

  const clearFilters = () => {
    onChange({ searchTerm: filters.searchTerm });
  };

  const containerTypeValue = filters.containerTypeId != null ? String(filters.containerTypeId) : "all";
  const statusValue = filters.status ?? "all";
  const productTypeValue = filters.currentProductTypeId != null ? String(filters.currentProductTypeId) : "all";

  return (
    <div className="glass rounded-[28px] border border-primary/10 p-3 shadow-[var(--luxury-shadow)]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={filters.searchTerm || ""}
            onChange={(e) => update({ searchTerm: e.target.value || undefined })}
            placeholder="Пошук за кодом або назвою..."
            className="h-11 rounded-2xl border-border/70 bg-background/70 pl-9"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setExpanded((value) => !value)}
          className={
            hasActiveFilters
              ? "gap-1.5 rounded-2xl border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              : "gap-1.5 rounded-2xl hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          }
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">{expanded ? "Сховати фільтри" : "Фільтри"}</span>
          {hasActiveFilters ? (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              !
            </span>
          ) : null}
        </Button>
      </div>

      {expanded ? (
        <div className="mt-3 border-t border-border/70 px-1 pb-1 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Тип тари</Label>
              <Select value={containerTypeValue} onValueChange={(value) => update({ containerTypeId: toNumberOrUndefined(value) })}>
                <SelectTrigger className="h-11 rounded-2xl border-border/70 bg-background/70">
                  <SelectValue placeholder="Всі типи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі типи</SelectItem>
                  {containerTypes.map((ct) => (
                    <SelectItem key={ct.id} value={String(ct.id)}>
                      {ct.name ?? "-"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Статус</Label>
              <Select
                value={statusValue}
                onValueChange={(value) =>
                  update({
                    status: value !== "all" ? (value as ContainerStatus) : undefined,
                  })
                }
              >
                <SelectTrigger className="h-11 rounded-2xl border-border/70 bg-background/70">
                  <SelectValue placeholder="Всі" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі</SelectItem>
                  <SelectItem value="Empty">Порожня</SelectItem>
                  <SelectItem value="Full">Заповнена</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Дата виробництва</Label>
              <Input
                type="date"
                value={fromIsoToDateInput(filters.productionDate)}
                onChange={(e) => update({ productionDate: toIsoStartOfDay(e.target.value) })}
                className="h-11 rounded-2xl border-border/70 bg-background/70"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Тип продукту</Label>
              <Select
                value={productTypeValue}
                onValueChange={(value) =>
                  update({
                    currentProductTypeId: toNumberOrUndefined(value),
                  })
                }
              >
                <SelectTrigger className="h-11 rounded-2xl border-border/70 bg-background/70">
                  <SelectValue placeholder="Всі типи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі типи</SelectItem>
                  {productTypes.map((pt) => (
                    <SelectItem key={pt.id} value={String(pt.id)}>
                      {pt.name ?? "-"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:col-span-2">
              <label className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/20 hover:bg-primary/5">
                <input
                  type="checkbox"
                  checked={Boolean(filters.showExpired)}
                  onChange={(e) => update({ showExpired: e.target.checked ? true : undefined })}
                  className="rounded border-input"
                />
                Прострочені
              </label>

              <label className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/20 hover:bg-primary/5">
                <input
                  type="checkbox"
                  checked={filledTodayChecked}
                  onChange={(e) =>
                    update({
                      filledToday: e.target.checked ? toIsoStartOfDay(todayYmd()) : undefined,
                    })
                  }
                  className="rounded border-input"
                />
                Заповнені сьогодні
              </label>
            </div>
          </div>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="mt-3 h-auto gap-1.5 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Скинути фільтри
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
