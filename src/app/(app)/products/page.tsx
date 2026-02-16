// src/app/(app)/products/page.tsx
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
import { toast } from "sonner";

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const isDesktop = useIsDesktop();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductDto | null>(null);

  const [search, setSearch] = useState("");
  const debounceRef = useRef<number | null>(null);

  const effectiveSearch = useMemo(() => search.trim().toLowerCase(), [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch {
      toast.error("Не вдалося завантажити продукти");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchProducts(), getProductTypes()])
      .then(([, types]) => setProductTypes(types))
      .catch(() => {});
  }, [fetchProducts]);

  // Debounced search (similar behavior to containers page)
  const filteredProducts = useMemo(() => {
    if (!effectiveSearch) return products;

    return products.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const typeName = (p.productTypeName ?? "").toLowerCase();
      return name.includes(effectiveSearch) || typeName.includes(effectiveSearch);
    });
  }, [products, effectiveSearch]);

  // optional: debounce search input state -> just to match "feel" (not mandatory)
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

  const handleDelete = async (id: number, name: string | null) => {
    const label = (name ?? "").trim() || `#${id}`;
    if (!window.confirm(`Видалити продукт "${label}"?`)) return;

    try {
      await deleteProduct(id);
      toast.success("Продукт видалено");
      await refresh();
    } catch {
      toast.error("Не вдалося видалити продукт");
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Продукти</h1>
          <p className="text-sm text-muted-foreground">Управління асортиментом та типами продукції</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Додати
          </button>
        )}
      </div>

      {/* Filters row (simple search like before) */}
      <div className="flex items-center gap-3">
        <div className="w-full max-w-sm">
          <input
            value={searchUi}
            onChange={(e) => setSearchUi(e.target.value)}
            placeholder="Пошук продуктів..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card/50 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-24 text-center">
          <div className="rounded-full bg-muted p-4">
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
          onDelete={(p) => handleDelete(p.id, p.name)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isAdmin={isAdmin}
              onEdit={() => setEditProduct(p)}
              onDelete={() => handleDelete(p.id, p.name)}
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

      {editProduct && (
        <EditProductDialog
          product={editProduct}
          open={true}
          onClose={() => setEditProduct(null)}
          onUpdated={refresh}
          productTypes={productTypes}
        />
      )}
    </div>
  );
}
