"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Package } from "lucide-react";
import { getProducts, deleteProduct } from "@/shared/api/products";
import { getProductTypes } from "@/shared/api/product-types";
import { useAuth } from "@/shared/auth/AuthProvider";
import type { ProductDto, ProductTypeDto } from "@/shared/types";
import { CreateProductDialog } from "@/shared/ui/products/CreateProductDialog";
import { EditProductDialog } from "@/shared/ui/products/EditProductDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductDto | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch {
      toast.error("Не вдалося завантажити продукти");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchProducts(), getProductTypes()])
      .then(([_, types]) => setProductTypes(types))
      .catch(() => {});
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Видалити продукт "${name}"?`)) return;

    try {
      await deleteProduct(id);
      toast.success("Продукт видалено");
      fetchProducts();
    } catch {
      toast.error("Не вдалося видалити продукт");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.productTypeName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Продукти
        </h1>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Додати
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Пошук продуктів..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-navy" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            Продукти не знайдено
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {product.productTypeName}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {product.description && (
                  <p className="text-sm text-muted-foreground">
                    {product.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {product.shelfLifeDays && (
                    <span className="bg-muted px-2 py-1 rounded">
                      Термін: {product.shelfLifeDays} днів
                    </span>
                  )}
                  {product.shelfLifeHours && (
                    <span className="bg-muted px-2 py-1 rounded">
                      Термін: {product.shelfLifeHours} годин
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditProduct(product)}
                    >
                      Редагувати
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(product.id, product.name)}
                    >
                      Видалити
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateProductDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchProducts}
        productTypes={productTypes}
      />

      {editProduct && (
        <EditProductDialog
          product={editProduct}
          open={!!editProduct}
          onClose={() => setEditProduct(null)}
          onUpdated={fetchProducts}
          productTypes={productTypes}
        />
      )}
    </div>
  );
}
