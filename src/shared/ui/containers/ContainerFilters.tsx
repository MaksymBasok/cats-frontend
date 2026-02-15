"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import type { ContainerTypeDto, ProductTypeDto } from "@/shared/types";
import { ContainerStatus } from "@/shared/types";
import type { SearchContainersParams } from "@/shared/types";

interface ContainerFiltersProps {
  filters: SearchContainersParams;
  onChange: (filters: SearchContainersParams) => void;
  containerTypes: ContainerTypeDto[];
  productTypes: ProductTypeDto[];
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

  const hasActiveFilters =
    filters.containerTypeId ||
    filters.status !== undefined ||
    filters.currentProductTypeId ||
    filters.showExpired ||
    filters.filledToday;

  const clearFilters = () => {
    onChange({ searchTerm: filters.searchTerm });
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Search bar - always visible */}
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
          onClick={() => setExpanded(!expanded)}
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

      {/* Expandable filter panel */}
      {expanded && (
        <div className="border-t border-border px-3 pb-3 pt-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Тип тари
              </label>
              <select
                value={filters.containerTypeId || ""}
                onChange={(e) =>
                  update({ containerTypeId: e.target.value || undefined })
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Всі типи</option>
                {containerTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Статус
              </label>
              <select
                value={filters.status !== undefined ? String(filters.status) : ""}
                onChange={(e) =>
                  update({
                    status: e.target.value
                      ? (Number(e.target.value) as ContainerStatus)
                      : undefined,
                  })
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Всі</option>
                <option value={String(ContainerStatus.Empty)}>Порожня</option>
                <option value={String(ContainerStatus.Full)}>Заповнена</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Тип продукту
              </label>
              <select
                value={filters.currentProductTypeId || ""}
                onChange={(e) =>
                  update({
                    currentProductTypeId: e.target.value || undefined,
                  })
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Всі типи</option>
                {productTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={filters.showExpired || false}
                  onChange={(e) => update({ showExpired: e.target.checked || undefined })}
                  className="rounded border-input"
                />
                Прострочені
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={filters.filledToday || false}
                  onChange={(e) => update({ filledToday: e.target.checked || undefined })}
                  className="rounded border-input"
                />
                Заповнені сьогодні
              </label>
            </div>
          </div>

          {hasActiveFilters && (
            <button
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
