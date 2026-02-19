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
  const id = safeParam(params.id as string | string[] | undefined);
  const parsedId = Number(id);
  const hasValidId = Number.isInteger(parsedId) && parsedId > 0;

  const [item, setItem] = useState<ProductTypeDto | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hasValidId) {
      setItem(null);
      setProducts([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [typeItem, productsByType] = await Promise.all([
        getProductType(String(parsedId)),
        searchProducts({ productTypeId: parsedId }),
      ]);
      setItem(typeItem);
      setProducts(productsByType);
    } catch (error) {
      setItem(null);
      setProducts([]);
      setLoadError("Не вдалося завантажити дані типу продукту.");
      showErrorToast(error, "Не вдалося завантажити дані типу продукту");
    } finally {
      setLoading(false);
    }
  }, [hasValidId, parsedId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasValidId) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Некоректний ID типу продукту.</p>
        <Button asChild variant="outline">
          <Link href="/product-types">
            <ArrowLeft className="mr-2 h-4 w-4" />
            До типів продуктів
          </Link>
        </Button>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-8">
          <p className="text-sm text-destructive">{loadError}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void load()}>
              Повторити
            </Button>
            <Button asChild variant="ghost">
              <Link href="/product-types">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!item) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Тип продукту не знайдено.</p>
        <Button asChild variant="outline">
          <Link href="/product-types">
            <ArrowLeft className="mr-2 h-4 w-4" />
            До типів продуктів
          </Link>
        </Button>
      </div>
    );
  }

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
        <CardHeader>
          <CardTitle>Інформація про тип</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Термін придатності:{" "}
            <span className="font-medium">
              {item.shelfLifeDays ?? 0} дн. {item.shelfLifeHours ?? 0} год.
            </span>
          </p>
          {item.meta && (
            <p>
              Примітки: <span className="font-medium">{item.meta}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Продукти цього типу ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Для цього типу продуктів не знайдено.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва</TableHead>
                  <TableHead>Опис</TableHead>
                  <TableHead>Термін придатності</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name || `#${product.id}`}</TableCell>
                    <TableCell>{product.description || "-"}</TableCell>
                    <TableCell>
                      {product.shelfLifeDays ?? 0} дн. {product.shelfLifeHours ?? 0} год.
                    </TableCell>
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
