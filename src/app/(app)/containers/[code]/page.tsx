// src/app/(app)/containers/[code]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ContainerDto, ContainerFillDto, ContainerStatus } from "@/shared/types";
import * as containersApi from "@/shared/api/containers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Droplets, Edit, Package, Trash2, X } from "lucide-react";
import { FillContainerDialog } from "@/shared/ui/containers/FillContainerDialog";
import { EditFillDialog } from "@/shared/ui/containers/EditFillDialog";
import { format } from "date-fns";
import { toast } from "sonner";

function safeParam(p: string | string[] | undefined): string {
  if (!p) return "";
  return Array.isArray(p) ? p[0] : p;
}

export default function ContainerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = safeParam(params.code as any);

  const [container, setContainer] = useState<ContainerDto | null>(null);
  const [history, setHistory] = useState<ContainerFillDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fillOpen, setFillOpen] = useState(false);
  const [editFillOpen, setEditFillOpen] = useState(false);

  useEffect(() => {
    if (!code) return;
    void fetchContainerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const fetchContainerData = async () => {
    try {
      setLoading(true);

      const containerData = await containersApi.getContainerByCode(code);
      setContainer(containerData);

      try {
        const historyData = await containersApi.getContainerHistory(containerData.id);
        setHistory(historyData);
      } catch {
        setHistory([]);
      }
    } catch {
      toast.error("Не вдалося завантажити дані контейнера");
      router.push("/containers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!container) return;

    const label = container.code ?? code;
    if (!window.confirm(`Видалити контейнер ${label}? Цю дію не можна скасувати.`)) return;

    try {
      await containersApi.deleteContainer(container.id);
      toast.success("Контейнер видалено");
      router.push("/containers");
    } catch {
      toast.error("Не вдалося видалити контейнер");
    }
  };

  const handleEmpty = async () => {
    if (!container) return;
    if (!window.confirm("Спорожнити цей контейнер?")) return;

    try {
      await containersApi.emptyContainer(container.id);
      toast.success("Контейнер спорожнено");
      await fetchContainerData();
    } catch {
      toast.error("Не вдалося спорожнити контейнер");
    }
  };

  const handleExportQR = () => {
    if (!container) return;
    const containerCode = container.code ?? code;
    const qrUrl = `${window.location.origin}/containers/${encodeURIComponent(containerCode)}`;

    navigator.clipboard
      .writeText(qrUrl)
      .then(() => toast.success("Посилання для QR скопійовано"))
      .catch(() => toast.success("Посилання для QR: " + qrUrl));
  };

  const statusLabel = useMemo(() => {
    const s: ContainerStatus | null = container?.status ?? null;
    if (s === "Empty") return "Порожній";
    if (s === "Full") return "Заповнений";
    return "—";
  }, [container?.status]);

  const statusDotClass = useMemo(() => {
    const s: ContainerStatus | null = container?.status ?? null;
    if (s === "Empty") return "bg-gray-500";
    if (s === "Full") return "bg-blue-500";
    return "bg-muted-foreground";
  }, [container?.status]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!container) return null;

  const isFull = container.status === "Full";
  const isEmpty = !isFull;
  const containerCode = container.code ?? code;

  const hasCurrentContent =
    isFull &&
    (container.currentProductName != null ||
      container.currentQuantity != null ||
      container.currentProductionDate != null ||
      container.currentExpirationDate != null);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/containers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{containerCode}</h1>
            <p className="text-sm text-muted-foreground">
              Створено {format(new Date(container.createdAt), "dd.MM.yyyy")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isEmpty ? (
            <Button size="sm" onClick={() => setFillOpen(true)} className="bg-brand-navy">
              <Droplets className="mr-2 h-4 w-4" />
              Заповнити
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditFillOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Редагувати
              </Button>
              <Button size="sm" variant="outline" onClick={handleEmpty}>
                <X className="mr-2 h-4 w-4" />
                Спорожнити
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" onClick={handleExportQR}>
            <Download className="mr-2 h-4 w-4" />
            QR
          </Button>

          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Видалити
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Статус</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${statusDotClass}`} />
              <span className="text-2xl font-bold">{statusLabel}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Тип</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{container.containerTypeName ?? "—"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Деталі</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Код контейнера</p>
              <p className="text-lg font-medium">{containerCode}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Назва</p>
              <p className="text-lg font-medium">{container.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Об&apos;єм</p>
              <p className="text-lg font-medium">
                {container.volume} {container.unit ?? ""}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Тип контейнера</p>
              <p className="text-lg font-medium">{container.containerTypeName ?? "—"}</p>
            </div>
          </div>

          {/* Current content */}
          {hasCurrentContent && (
            <div className="border-t pt-4">
              <h3 className="mb-2 font-medium">Поточний вміст</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Продукт</p>
                  <p className="text-lg font-medium">{container.currentProductName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Кількість</p>
                  <p className="text-lg font-medium">
                    {container.currentQuantity ?? "—"} {container.unit ?? ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Дата виробництва</p>
                  <p className="text-lg font-medium">
                    {container.currentProductionDate
                      ? format(new Date(container.currentProductionDate), "dd.MM.yyyy")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Термін придатності</p>
                  <p className="text-lg font-medium">
                    {container.currentExpirationDate
                      ? format(new Date(container.currentExpirationDate), "dd.MM.yyyy")
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Історія</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((fill) => (
                <div key={fill.id} className="border-l-2 border-primary py-2 pl-4">
                  <div className="font-medium">{fill.productName ?? "—"}</div>
                  <div className="text-sm text-muted-foreground">
                    {fill.quantity} {fill.unit ?? ""} • {format(new Date(fill.filledDate), "dd.MM.yyyy HH:mm")}
                  </div>
                  {fill.emptiedDate && (
                    <div className="text-sm text-muted-foreground">
                      Спорожнено: {format(new Date(fill.emptiedDate), "dd.MM.yyyy HH:mm")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {isEmpty && (
        <FillContainerDialog
          container={container}
          open={fillOpen}
          onClose={() => setFillOpen(false)}
          onSuccess={fetchContainerData}
        />
      )}
      {!isEmpty && (
        <EditFillDialog
          container={container}
          open={editFillOpen}
          onClose={() => setEditFillOpen(false)}
          onSuccess={fetchContainerData}
        />
      )}
    </div>
  );
}
