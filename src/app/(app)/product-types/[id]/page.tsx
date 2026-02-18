"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProductType } from "@/shared/api/product-types";
import { searchProducts } from "@/shared/api/products";
import type { ProductDto, ProductTypeDto } from "@/shared/types";
import { showErrorToast } from "@/shared/utils/errors";

function safeParam(p: string | string[] | undefined): string {
  if (!p) return "";
  return Array.isArray(p) ? p[0] : p;
}

export default function ProductTypeDetailPage() {
  const params = useParams();
  const id = safeParam(params.id as unknown);

  const [item, setItem] = useState<ProductTypeDto | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [typeItem, productsByType] = await Promise.all([
        getProductType(id),
        searchProducts({ productTypeId: Number(id) }),
      ]);
      setItem(typeItem);
      setProducts(productsByType);
    } catch (error) {
      showErrorToast(error, "Не вдалося завантажити дані типу продукту");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-sm text-muted-foreground">Завантаження...</p>;
  if (!item) return <p className="text-sm text-muted-foreground">Тип продукту не знайдено.</p>;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon">
          <Link href="/product-types">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{item.name || `Тип #${item.id}`}</h1>
        <Badge variant="secondary">#{item.id}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Інформація про тип</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Термін придатності: <span className="font-medium">{item.shelfLifeDays ?? 0} дн. {item.shelfLifeHours ?? 0} год.</span></p>
          {item.meta && <p>Meta: <span className="font-medium">{item.meta}</span></p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Продукти цього типу ({products.length})</CardTitle></CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Для цього типу ще немає продуктів.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Назва</TableHead><TableHead>Опис</TableHead><TableHead>Термін</TableHead></TableRow></TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name || `#${product.id}`}</TableCell>
                    <TableCell>{product.description || "—"}</TableCell>
                    <TableCell>{product.shelfLifeDays ?? 0} дн. {product.shelfLifeHours ?? 0} год.</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
