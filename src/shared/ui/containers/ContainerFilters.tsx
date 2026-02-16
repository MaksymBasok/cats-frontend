// src/shared/ui/containers/ContainerFilters.tsx
"use client";

import { useMemo, useState } from "react";
import { Search, Filter, X } from "lucide-react";
import type {
  ContainerTypeDto,
  ProductTypeDto,
  SearchContainersParams,
  ContainerStatus,
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

function toNumberOrUndefined(v: string): number | undefined {
  if (!v) return undefined;
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

  // UI toggle -> API expects filledToday string (date) in your types.
  const filledTodayChecked = useMemo(() => {
    return !!filters.filledToday;
  }, [filters.filledToday]);

  const hasActiveFilters = useMemo(() => {
    return (
      (filters.containerTypeId != null && filters.containerTypeId !== undefined) ||
      (filters.status != null && filters.status !== undefined) ||
      (filters.currentProductTypeId != null && filters.currentProductTypeId !== undefined) ||
      !!filters.showExpired ||
      !!filters.filledToday
    );
  }, [
    filters.containerTypeId,
    filters.status,
    filters.currentProductTypeId,
    filters.showExpired,
    filters.filledToday,
  ]);

  const clearFilters = () => {
    onChange({ searchTerm: filters.searchTerm });
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Search bar */}
      <div className="flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={filters.searchTerm || ""}
            onChange={(e) => update({ searchTerm: e.target.value || undefined })}
            placeholder="Пошук за кодом, назвою..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            hasActiveFilters
              ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
              : "border-border text-foreground hover:bg-muted"
          }`}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Фільтри</span>
          {hasActiveFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-brand-navy">
              !
            </span>
          )}
        </button>
      </div>

      {/* Expandable panel */}
      {expanded && (
        <div className="border-t border-border px-3 pb-3 pt-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Тип тари
              </label>
              <select
                value={filters.containerTypeId != null ? String(filters.containerTypeId) : ""}
                onChange={(e) => update({ containerTypeId: toNumberOrUndefined(e.target.value) })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Всі типи</option>
                {containerTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name ?? "—"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Статус
              </label>
              <select
                value={filters.status ?? ""}
                onChange={(e) =>
                  update({
                    status: (e.target.value ? (e.target.value as ContainerStatus) : undefined),
                  })
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Всі</option>
                <option value="Empty">Порожня</option>
                <option value="Full">Заповнена</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Тип продукту
              </label>
              <select
                value={filters.currentProductTypeId != null ? String(filters.currentProductTypeId) : ""}
                onChange={(e) =>
                  update({
                    currentProductTypeId: toNumberOrUndefined(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Всі типи</option>
                {productTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name ?? "—"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={!!filters.showExpired}
                  onChange={(e) => update({ showExpired: e.target.checked ? true : undefined })}
                  className="rounded border-input"
                />
                Прострочені
              </label>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={filledTodayChecked}
                  onChange={(e) =>
                    update({
                      filledToday: e.target.checked ? todayYmd() : undefined,
                    })
                  }
                  className="rounded border-input"
                />
                Заповнені сьогодні
              </label>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Скинути фільтри
            </button>
          )}
        </div>
      )}
    </div>
  );
}
