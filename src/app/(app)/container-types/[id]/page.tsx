"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

function statusLabel(status: string | null | undefined): string {
  if (status === "Full") return "Заповнена";
  if (status === "Empty") return "Порожня";
  return "-";
}

export default function ContainerTypeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = safeParam(params.id as string | string[] | undefined);
  const parsedId = Number(id);
  const hasValidId = Number.isInteger(parsedId) && parsedId > 0;

  const [item, setItem] = useState<ContainerTypeDto | null>(null);
  const [containers, setContainers] = useState<ContainerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hasValidId) {
      setItem(null);
      setContainers([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [typeItem, typeContainers] = await Promise.all([
        getContainerType(String(parsedId)),
        searchContainers({ containerTypeId: parsedId }),
      ]);
      setItem(typeItem);
      setContainers(typeContainers);
    } catch (error) {
      setItem(null);
      setContainers([]);
      setLoadError("Не вдалося завантажити дані типу тари.");
      showErrorToast(error, "Не вдалося завантажити дані типу тари");
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
        <p className="text-sm text-muted-foreground">Некоректний ID типу тари.</p>
        <Button asChild variant="outline">
          <Link href="/container-types">
            <ArrowLeft className="mr-2 h-4 w-4" />
            До типів тари
          </Link>
        </Button>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="stylish-card border-primary/10">
        <CardContent className="flex flex-col items-start gap-3 py-8">
          <p className="text-sm text-destructive">{loadError}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void load()}>
              Повторити
            </Button>
            <Button asChild variant="ghost">
              <Link href="/container-types">
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
        <p className="text-sm text-muted-foreground">Тип тари не знайдено.</p>
        <Button asChild variant="outline">
          <Link href="/container-types">
            <ArrowLeft className="mr-2 h-4 w-4" />
            До типів тари
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <section className="glass relative overflow-hidden rounded-[28px] border border-primary/10 p-6 shadow-[var(--luxury-shadow)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="icon">
            <Link href="/container-types">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Тип тари</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{item.name || `Тип #${item.id}`}</h1>
              <Badge variant="secondary">#{item.id}</Badge>
            </div>
          </div>
        </div>
      </section>

      <Card className="stylish-card border-primary/10">
        <CardHeader>
          <CardTitle>Інформація про тип</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Префікс: <span className="font-medium">{item.codePrefix || "-"}</span>
          </p>
          <p>
            Базова одиниця: <span className="font-medium">{item.defaultUnit || "-"}</span>
          </p>
          <p>
            Дозволені типи продуктів:{" "}
            <span className="font-medium">{item.allowedProductTypeNames?.join(", ") || "усі"}</span>
          </p>
          {item.meta ? (
            <p>
              Примітки: <span className="font-medium">{item.meta}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="stylish-card border-primary/10">
        <CardHeader>
          <CardTitle>Тара цього типу ({containers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {containers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Для цього типу тари записів не знайдено.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код</TableHead>
                  <TableHead>Назва</TableHead>
                  <TableHead>Об&apos;єм</TableHead>
                  <TableHead>Стан</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {containers.map((container) => (
                  <TableRow
                    key={container.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/containers/${encodeURIComponent(container.code ?? String(container.id))}`)
                    }
                  >
                    <TableCell>{container.code ?? `#${container.id}`}</TableCell>
                    <TableCell>{container.name || "-"}</TableCell>
                    <TableCell>
                      {container.volume} {container.unit || ""}
                    </TableCell>
                    <TableCell>{statusLabel(container.status)}</TableCell>
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
