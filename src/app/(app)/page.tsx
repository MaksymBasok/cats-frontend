// src/app/(app)/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Loader2, PackageOpen } from "lucide-react";
import { searchContainers } from "@/shared/api/containers";
import { getContainerTypes } from "@/shared/api/container-types";
import { getProductTypes } from "@/shared/api/product-types";
import { useAuth } from "@/shared/auth/AuthProvider";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import type { ContainerDto, ContainerTypeDto, ProductTypeDto, SearchContainersParams } from "@/shared/types";
import { ContainerFilters } from "@/shared/ui/containers/ContainerFilters";
import { ContainerCard } from "@/shared/ui/containers/ContainerCard";
import { ContainerTable } from "@/shared/ui/containers/ContainerTable";
import { CreateContainerDialog } from "@/shared/ui/containers/CreateContainerDialog";
import { toast } from "sonner";

export default function ContainersPage() {
  const { isAdmin } = useAuth();
  const isDesktop = useIsDesktop();

  const [containers, setContainers] = useState<ContainerDto[]>([]);
  const [containerTypes, setContainerTypes] = useState<ContainerTypeDto[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const [filters, setFilters] = useState<SearchContainersParams>({});

  // Debounce *all* filter changes (not only searchTerm), avoid duplicate fetches
  const debounceRef = useRef<number | null>(null);

  const effectiveFilters = useMemo<SearchContainersParams>(() => {
    // Normalize: remove empty string values (so URLSearchParams won't get junk)
    const f: SearchContainersParams = { ...filters };
    if (f.searchTerm && !f.searchTerm.trim()) delete f.searchTerm;
    return f;
  }, [filters]);

  const fetchContainers = useCallback(
    async (f: SearchContainersParams) => {
      setLoading(true);
      try {
        const data = await searchContainers(f);
        setContainers(data);
      } catch {
        toast.error("Не вдалося завантажити тару");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load of filters options
  useEffect(() => {
    Promise.all([getContainerTypes(), getProductTypes()])
      .then(([cts, pts]) => {
        setContainerTypes(cts);
        setProductTypes(pts);
      })
      .catch(() => {});
  }, []);

  // Debounced fetch on any filter change
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      void fetchContainers(effectiveFilters);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [effectiveFilters, fetchContainers]);

  // immediate refresh callback for dialogs/actions
  const refresh = useCallback(async () => {
    await fetchContainers(effectiveFilters);
  }, [fetchContainers, effectiveFilters]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Тара</h1>

        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-navy px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Додати
          </button>
        )}
      </div>

      <ContainerFilters
        filters={filters}
        onChange={setFilters}
        containerTypes={containerTypes}
        productTypes={productTypes}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-navy" />
        </div>
      ) : containers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageOpen className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">Тару не знайдено</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Спробуйте змінити фільтри або додайте нову тару</p>
        </div>
      ) : isDesktop ? (
        <ContainerTable containers={containers} />
      ) : (
        <div className="flex flex-col gap-2">
          {containers.map((c) => (
            <ContainerCard key={c.id} container={c} />
          ))}
        </div>
      )}

      <CreateContainerDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refresh}
        containerTypes={containerTypes}
      />
    </div>
  );
}
