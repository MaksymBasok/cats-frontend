// src/app/(app)/containers/[code]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ContainerDto, ContainerFillDto, ContainerStatus } from "@/shared/types";
import * as containersApi from "@/shared/api/containers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Droplets, Edit, Trash2, X } from "lucide-react";
import { FillContainerDialog } from "@/shared/ui/containers/FillContainerDialog";
import { EditFillDialog } from "@/shared/ui/containers/EditFillDialog";
import { QrGeneratorDialog } from "@/shared/ui/QrGeneratorDialog";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/utils/errors";

function safeParam(p: string | string[] | undefined): string {
  if (!p) return "";
  return Array.isArray(p) ? p[0] : p;
}

export default function ContainerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = safeParam(params.code as unknown);

  const [container, setContainer] = useState<ContainerDto | null>(null);
  const [history, setHistory] = useState<ContainerFillDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fillOpen, setFillOpen] = useState(false);
  const [editFillOpen, setEditFillOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
    } catch (error) {
      toast.error(getErrorMessage(error, "Не вдалося завантажити дані контейнера"));
      router.push("/containers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!container) return;

    try {
      setActionLoading(true);
      await containersApi.deleteContainer(container.id);
      toast.success("Контейнер видалено");
      router.push("/containers");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не вдалося видалити контейнер"));
    } finally {
      setActionLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleEmpty = async () => {
    if (!container) return;
    try {
      setActionLoading(true);
      await containersApi.emptyContainer(container.id);
      toast.success("Контейнер спорожнено");
      await fetchContainerData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не вдалося спорожнити контейнер"));
    } finally {
      setActionLoading(false);
      setEmptyConfirmOpen(false);
    }
  };

  const handleExportQR = () => {
    setQrOpen(true);
  };

  const qrUrl = useMemo(() => {
    if (!container) return "";
    const containerCode = container.code ?? code;
    return `${window.location.origin}/containers/${encodeURIComponent(containerCode)}`;
  }, [container, code]);

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
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{containerCode}</h1>
              <Badge variant="secondary" className="gap-2 px-3 py-1 text-sm font-semibold">
                <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
                {statusLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Створено {format(new Date(container.createdAt), "dd.MM.yyyy")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {isEmpty ? (
            <Button size="sm" onClick={() => setFillOpen(true)} className="bg-brand-navy">
              <Droplets className="mr-2 h-4 w-4" />
              Заповнити
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditFillOpen(true)}
                aria-label="Редагувати"
              >
                <Edit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Редагувати</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEmptyConfirmOpen(true)}>
                <X className="mr-2 h-4 w-4" />
                Спорожнити
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" onClick={handleExportQR}>
            <Download className="mr-2 h-4 w-4" />
            QR
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            aria-label="Видалити"
          >
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Видалити</span>
          </Button>
        </div>
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
      <QrGeneratorDialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        url={qrUrl}
        title={containerCode}
      />

      <ConfirmDialog
        open={emptyConfirmOpen}
        title="Спорожнити контейнер?"
        description="Поточне заповнення буде завершене. Ви зможете знову наповнити контейнер пізніше."
        confirmLabel="Спорожнити"
        cancelLabel="Скасувати"
        variant="default"
        onConfirm={handleEmpty}
        onCancel={() => setEmptyConfirmOpen(false)}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Видалити контейнер?"
        description={`Контейнер ${containerCode} буде видалено без можливості відновлення.`}
        confirmLabel="Видалити"
        cancelLabel="Скасувати"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        loading={actionLoading}
      />
    </div>
  );
}
