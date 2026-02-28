"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Loader2, PackageOpen } from "lucide-react";
import { searchContainers } from "@/shared/api/containers";
import { getContainerTypes } from "@/shared/api/container-types";
import { getProductTypes } from "@/shared/api/product-types";
import { useAuth } from "@/shared/auth/AuthProvider";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import type { ContainerDto, ContainerTypeDto, ProductTypeDto, SearchContainersParams } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { ContainerFilters } from "@/shared/ui/containers/ContainerFilters";
import { ContainerCard } from "@/shared/ui/containers/ContainerCard";
import { ContainerTable } from "@/shared/ui/containers/ContainerTable";
import { CreateContainerDialog } from "@/shared/ui/containers/CreateContainerDialog";
import { showErrorToast } from "@/shared/utils/errors";

export default function ContainersPage() {
  const { isAdmin } = useAuth();
  const isDesktop = useIsDesktop();

  const [containers, setContainers] = useState<ContainerDto[]>([]);
  const [containerTypes, setContainerTypes] = useState<ContainerTypeDto[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState<SearchContainersParams>({});

  const debounceRef = useRef<number | null>(null);
  const requestSeqRef = useRef(0);

  const effectiveFilters = useMemo<SearchContainersParams>(() => {
    const f: SearchContainersParams = { ...filters };
    if (f.searchTerm && !f.searchTerm.trim()) delete f.searchTerm;
    return f;
  }, [filters]);

  const fetchContainers = useCallback(async (f: SearchContainersParams) => {
    const requestSeq = ++requestSeqRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await searchContainers(f);
      if (requestSeq !== requestSeqRef.current) return;
      setContainers(data);
    } catch (error) {
      if (requestSeq !== requestSeqRef.current) return;
      setLoadError("Не вдалося завантажити список тари.");
      showErrorToast(error, "Не вдалося завантажити тару");
    } finally {
      if (requestSeq !== requestSeqRef.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadFilterOptions = async () => {
      try {
        const [cts, pts] = await Promise.all([getContainerTypes(), getProductTypes()]);
        if (cancelled) return;
        setContainerTypes(cts);
        setProductTypes(pts);
      } catch (error) {
        if (!cancelled) {
          showErrorToast(error, "Не вдалося завантажити довідники для фільтрів");
        }
      }
    };

    void loadFilterOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      void fetchContainers(effectiveFilters);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [effectiveFilters, fetchContainers]);

  const refresh = useCallback(async () => {
    await fetchContainers(effectiveFilters);
  }, [fetchContainers, effectiveFilters]);

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-6">
      <section className="glass relative overflow-hidden rounded-[28px] border border-primary/10 p-6 shadow-[var(--luxury-shadow)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Контейнери</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Управління тарою</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Єдиний список контейнерів із пошуком, фільтрами та швидким переходом до деталей.
            </p>
          </div>

          {isAdmin ? (
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Додати тару
            </Button>
          ) : null}
        </div>
      </section>

      <ContainerFilters
        filters={filters}
        onChange={setFilters}
        containerTypes={containerTypes}
        productTypes={productTypes}
      />

      {loading ? (
        <div className="stylish-card flex items-center justify-center rounded-[28px] border border-primary/10 bg-card/70 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <div className="stylish-card flex flex-col items-center justify-center rounded-[28px] border border-dashed border-border py-16 text-center">
          <p className="text-base font-medium text-foreground">{loadError}</p>
          <Button type="button" variant="outline" onClick={() => void fetchContainers(effectiveFilters)} className="mt-4 rounded-xl">
            Спробувати ще раз
          </Button>
        </div>
      ) : containers.length === 0 ? (
        <div className="stylish-card flex flex-col items-center justify-center rounded-[28px] border border-dashed border-border py-24 text-center">
          <div className="rounded-full bg-background/70 p-4">
            <PackageOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-base font-medium text-foreground">Тару не знайдено</p>
          <p className="mt-1 text-sm text-muted-foreground">Спробуйте змінити фільтри або додайте нову тару</p>
        </div>
      ) : isDesktop ? (
        <ContainerTable containers={containers} />
      ) : (
        <div className="flex flex-col gap-3">
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
