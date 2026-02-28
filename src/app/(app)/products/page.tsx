"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Loader2, Package } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthProvider";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import type { ProductDto, ProductTypeDto } from "@/shared/types";
import { getProducts, deleteProduct } from "@/shared/api/products";
import { getProductTypes } from "@/shared/api/product-types";
import { CreateProductDialog } from "@/shared/ui/products/CreateProductDialog";
import { EditProductDialog } from "@/shared/ui/products/EditProductDialog";
import { ProductsTable } from "@/shared/ui/products/ProductsTable";
import { ProductCard } from "@/shared/ui/products/ProductCard";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { toast } from "sonner";
import { showErrorToast } from "@/shared/utils/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const isDesktop = useIsDesktop();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductDto | null>(null);
  const [deleteProductItem, setDeleteProductItem] = useState<ProductDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debounceRef = useRef<number | null>(null);

  const effectiveSearch = useMemo(() => search.trim().toLowerCase(), [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      setLoadError("Не вдалося завантажити продукти.");
      showErrorToast(error, "Не вдалося завантажити продукти");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProductTypes = async () => {
      try {
        const types = await getProductTypes();
        if (!cancelled) setProductTypes(types);
      } catch (error) {
        if (!cancelled) {
          showErrorToast(error, "Не вдалося завантажити типи продуктів");
        }
      }
    };

    void fetchProducts();
    void loadProductTypes();

    return () => {
      cancelled = true;
    };
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (!effectiveSearch) return products;

    return products.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const typeName = (p.productTypeName ?? "").toLowerCase();
      return name.includes(effectiveSearch) || typeName.includes(effectiveSearch);
    });
  }, [products, effectiveSearch]);

  const [searchUi, setSearchUi] = useState("");
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setSearch(searchUi), 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchUi]);

  const refresh = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteProductItem) return;
    try {
      setDeleteLoading(true);
      await deleteProduct(deleteProductItem.id);
      toast.success("Продукт видалено");
      await refresh();
    } catch (error) {
      showErrorToast(error, "Не вдалося видалити продукт");
    } finally {
      setDeleteLoading(false);
      setDeleteProductItem(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-6">
      <section className="glass relative overflow-hidden rounded-[28px] border border-primary/10 p-6 shadow-[var(--luxury-shadow)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Продукти</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Асортимент і номенклатура</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Єдиний каталог продуктів у тій самій дизайн-системі, що й сторінки адміністрування.
            </p>
          </div>

          {isAdmin ? (
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Додати продукт
            </Button>
          ) : null}
        </div>
      </section>

      <div className="glass rounded-[28px] border border-primary/10 p-3 shadow-[var(--luxury-shadow)]">
        <Input
          value={searchUi}
          onChange={(e) => setSearchUi(e.target.value)}
          placeholder="Пошук продуктів..."
          className="h-11 rounded-2xl border-border/70 bg-background/70"
        />
      </div>

      {loading ? (
        <div className="stylish-card flex items-center justify-center rounded-[28px] border border-primary/10 bg-card/70 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <div className="stylish-card flex flex-col items-center justify-center rounded-[28px] border border-dashed border-border py-16 text-center">
          <p className="text-base font-medium text-foreground">{loadError}</p>
          <Button type="button" variant="outline" onClick={() => void fetchProducts()} className="mt-4 rounded-xl">
            Спробувати ще раз
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="stylish-card flex flex-col items-center justify-center rounded-[28px] border border-dashed border-border py-24 text-center">
          <div className="rounded-full bg-background/70 p-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-base font-medium text-foreground">Продукти не знайдено</p>
          <p className="mt-1 text-sm text-muted-foreground">Спробуйте змінити пошук або додайте новий продукт</p>
        </div>
      ) : isDesktop ? (
        <ProductsTable
          products={filteredProducts}
          isAdmin={isAdmin}
          onEdit={(p) => setEditProduct(p)}
          onDelete={(p) => setDeleteProductItem(p)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isAdmin={isAdmin}
              onEdit={() => setEditProduct(p)}
              onDelete={() => setDeleteProductItem(p)}
            />
          ))}
        </div>
      )}

      <CreateProductDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refresh}
        productTypes={productTypes}
      />

      {editProduct ? (
        <EditProductDialog
          product={editProduct}
          open={true}
          onClose={() => setEditProduct(null)}
          onUpdated={refresh}
          productTypes={productTypes}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteProductItem)}
        title="Видалити продукт?"
        description={`Продукт "${deleteProductItem?.name?.trim() || `#${deleteProductItem?.id ?? ""}`}" буде видалено.`}
        confirmLabel="Видалити"
        cancelLabel="Скасувати"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteProductItem(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
