"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getContainerType } from "@/shared/api/container-types";
import { searchContainers } from "@/shared/api/containers";
import type { ContainerDto, ContainerTypeDto } from "@/shared/types";
import { showErrorToast } from "@/shared/utils/errors";

function safeParam(p: string | string[] | undefined): string {
  if (!p) return "";
  return Array.isArray(p) ? p[0] : p;
}

export default function ContainerTypeDetailPage() {
  const params = useParams();
  const id = safeParam(params.id as unknown);

  const [item, setItem] = useState<ContainerTypeDto | null>(null);
  const [containers, setContainers] = useState<ContainerDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [typeItem, typeContainers] = await Promise.all([
        getContainerType(id),
        searchContainers({ containerTypeId: Number(id) }),
      ]);
      setItem(typeItem);
      setContainers(typeContainers);
    } catch (error) {
      showErrorToast(error, "Не вдалося завантажити дані типу тари");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-sm text-muted-foreground">Завантаження...</p>;
  if (!item) return <p className="text-sm text-muted-foreground">Тип тари не знайдено.</p>;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon">
          <Link href="/container-types">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{item.name || `Тип #${item.id}`}</h1>
        <Badge variant="secondary">#{item.id}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Інформація про тип</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Префікс: <span className="font-medium">{item.codePrefix || "—"}</span></p>
          <p>Одиниця: <span className="font-medium">{item.defaultUnit || "—"}</span></p>
          <p>Дозволені типи продуктів: <span className="font-medium">{item.allowedProductTypeNames?.join(", ") || "усі"}</span></p>
          {item.meta && <p>Meta: <span className="font-medium">{item.meta}</span></p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Тара цього типу ({containers.length})</CardTitle></CardHeader>
        <CardContent>
          {containers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Для цього типу ще немає тари.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Код</TableHead><TableHead>Назва</TableHead><TableHead>Обʼєм</TableHead><TableHead>Статус</TableHead></TableRow></TableHeader>
              <TableBody>
                {containers.map((container) => (
                  <TableRow key={container.id}>
                    <TableCell><Link href={`/containers/${encodeURIComponent(container.code ?? String(container.id))}`} className="underline">{container.code ?? `#${container.id}`}</Link></TableCell>
                    <TableCell>{container.name || "—"}</TableCell>
                    <TableCell>{container.volume} {container.unit || ""}</TableCell>
                    <TableCell>{container.status || "—"}</TableCell>
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
