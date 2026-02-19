// src/app/(app)/containers/[code]/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { showErrorToast } from "@/shared/utils/errors";
import { eventsApi, type Event } from "@/api/events";
import { ContainerTimeline } from "@/shared/ui/containers/ContainerTimeline";
import { useAuth } from "@/shared/auth/AuthProvider";
import { ApiError } from "@/shared/api/client";

function safeParam(p: string | string[] | undefined): string {
  if (!p) return "";
  return Array.isArray(p) ? p[0] : p;
}

export default function ContainerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const code = safeParam(params.code as string | string[] | undefined);
  const hasCode = code.trim().length > 0;

  const [container, setContainer] = useState<ContainerDto | null>(null);
  const [history, setHistory] = useState<ContainerFillDto[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [fillOpen, setFillOpen] = useState(false);
  const [editFillOpen, setEditFillOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [historyLoadFailed, setHistoryLoadFailed] = useState(false);
  const [eventsLoadFailed, setEventsLoadFailed] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);

  const fetchHistory = useCallback(async (containerId: number) => {
    setHistoryLoading(true);
    setHistoryLoadFailed(false);
    try {
      const historyData = await containersApi.getContainerHistory(containerId);
      setHistory(historyData);
    } catch {
      setHistory([]);
      setHistoryLoadFailed(true);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async (containerCode: string) => {
    setEventsLoading(true);
    setEventsLoadFailed(false);
    try {
      const eventItems = await eventsApi.getByContainer(containerCode);
      setEvents(eventItems);
    } catch {
      setEvents([]);
      setEventsLoadFailed(true);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const fetchContainerData = useCallback(async () => {
    if (!hasCode) {
      setLoading(false);
      setLoadError(null);
      setContainer(null);
      setHistory([]);
      setEvents([]);
      setHistoryLoadFailed(false);
      setEventsLoadFailed(false);
      setHistoryLoading(false);
      setEventsLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError(null);

      const containerData = await containersApi.getContainerByCode(code);
      setContainer(containerData);

      await Promise.all([
        fetchHistory(containerData.id),
        fetchEvents(containerData.code ?? code),
      ]);
    } catch (error) {
      setContainer(null);
      setHistory([]);
      setEvents([]);
      setHistoryLoadFailed(false);
      setEventsLoadFailed(false);
      setHistoryLoading(false);
      setEventsLoading(false);
      setLoadError("Не вдалося завантажити дані тари.");

      if (!(error instanceof ApiError && error.status === 404)) {
        showErrorToast(error, "Не вдалося завантажити дані тари");
      }
    } finally {
      setLoading(false);
    }
  }, [code, fetchEvents, fetchHistory, hasCode]);

  useEffect(() => {
    void fetchContainerData();
  }, [fetchContainerData]);

  const handleDelete = async () => {
    if (!container) return;

    try {
      setActionLoading(true);
      await containersApi.deleteContainer(container.id);
      toast.success("Тару видалено");
      router.push("/containers");
    } catch (error) {
      showErrorToast(error, "Не вдалося видалити тару");
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
      toast.success("Тару звільнено");
      await fetchContainerData();
    } catch (error) {
      showErrorToast(error, "Не вдалося звільнити тару");
    } finally {
      setActionLoading(false);
      setEmptyConfirmOpen(false);
    }
  };

  const handleExportQR = () => {
    setQrOpen(true);
  };

  const qrUrl = useMemo(() => {
    if (!container || typeof window === "undefined") return "";
    const containerCode = container.code ?? code;
    return `${window.location.origin}/containers/${encodeURIComponent(containerCode)}`;
  }, [container, code]);

  const statusLabel = useMemo(() => {
    const s: ContainerStatus | null = container?.status ?? null;
    if (s === "Empty") return "Порожня";
    if (s === "Full") return "Заповнена";
    return "-";
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

  if (!hasCode) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Некоректний код тари.</p>
        <Button variant="outline" onClick={() => router.push("/containers")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          До списку тари
        </Button>
      </div>
    );
  }

  if (!container) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{loadError ?? "Тару не знайдено."}</p>
        <div className="flex flex-wrap gap-2">
          {loadError ? (
            <Button variant="outline" onClick={() => void fetchContainerData()}>
              Повторити
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => router.push("/containers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            До списку тари
          </Button>
        </div>
      </div>
    );
  }

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
            <Button
              size="sm"
              onClick={() => setFillOpen(true)}
              className="bg-brand-navy"
              disabled={actionLoading}
            >
              <Droplets className="mr-2 h-4 w-4" />
              Заповнити
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditFillOpen(true)}
                aria-label="Редагувати вміст"
                disabled={actionLoading}
              >
                <Edit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Редагувати</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEmptyConfirmOpen(true)}
                disabled={actionLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Звільнити
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" onClick={handleExportQR} disabled={actionLoading}>
            <Download className="mr-2 h-4 w-4" />
            QR-код
          </Button>

          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              aria-label="Видалити тару"
              disabled={actionLoading}
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Видалити</span>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Деталі</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Код</p>
              <p className="text-lg font-medium">{containerCode}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Назва</p>
              <p className="text-lg font-medium">{container.name ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Обʼєм</p>
              <p className="text-lg font-medium">
                {container.volume} {container.unit ?? ""}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Тип</p>
              <p className="text-lg font-medium">{container.containerTypeName ?? "-"}</p>
            </div>
          </div>

          {hasCurrentContent && (
            <div className="border-t pt-4">
              <h3 className="mb-2 font-medium">Поточний вміст</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Продукт</p>
                  <p className="text-lg font-medium">{container.currentProductName ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Кількість</p>
                  <p className="text-lg font-medium">
                    {container.currentQuantity ?? "-"} {container.unit ?? ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Дата виробництва</p>
                  <p className="text-lg font-medium">
                    {container.currentProductionDate
                      ? format(new Date(container.currentProductionDate), "dd.MM.yyyy")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Термін придатності</p>
                  <p className="text-lg font-medium">
                    {container.currentExpirationDate
                      ? format(new Date(container.currentExpirationDate), "dd.MM.yyyy")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Історія та аудит</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <details open className="rounded-lg border border-border p-3">
            <summary className="cursor-pointer font-medium">Історія вмісту</summary>

            {historyLoadFailed ? (
              <div className="mt-3 flex flex-col items-start gap-2">
                <p className="text-sm text-destructive">Не вдалося завантажити історію вмісту.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void fetchHistory(container.id)}
                  disabled={historyLoading}
                >
                  Повторити
                </Button>
              </div>
            ) : historyLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">Завантаження історії...</p>
            ) : history.length > 0 ? (
              <div className="mt-4 space-y-4">
                {history.map((fill) => (
                  <div key={fill.id} className="rounded-md border border-border/80 bg-muted/20 p-3">
                    <div className="font-medium">{fill.productName ?? "-"}</div>
                    <div className="text-sm text-muted-foreground">
                      Кількість: {fill.quantity} {fill.unit ?? ""}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Заповнено: {format(new Date(fill.filledDate), "dd.MM.yyyy HH:mm")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Дата виробництва: {format(new Date(fill.productionDate), "dd.MM.yyyy")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Термін придатності: {format(new Date(fill.expirationDate), "dd.MM.yyyy")}
                    </div>
                    {fill.emptiedDate && (
                      <div className="text-sm text-muted-foreground">
                        Звільнено: {format(new Date(fill.emptiedDate), "dd.MM.yyyy HH:mm")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Історія вмісту поки відсутня.</p>
            )}
          </details>

          <details open className="rounded-lg border border-border p-3">
            <summary className="cursor-pointer font-medium">Аудит подій</summary>

            {eventsLoadFailed ? (
              <div className="mt-3 flex flex-col items-start gap-2">
                <p className="text-sm text-destructive">Не вдалося завантажити аудит подій.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void fetchEvents(containerCode)}
                  disabled={eventsLoading}
                >
                  Повторити
                </Button>
              </div>
            ) : eventsLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">Завантаження подій...</p>
            ) : (
              <div className="mt-4">
                <ContainerTimeline
                  events={events.map((event) => ({
                    id: event.id,
                    type: event.type,
                    timestamp: event.timestamp,
                    metadata: event.data,
                    performedBy: { id: event.userId, name: event.userName },
                  }))}
                />
              </div>
            )}
          </details>
        </CardContent>
      </Card>

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

      <QrGeneratorDialog open={qrOpen} onClose={() => setQrOpen(false)} url={qrUrl} title={containerCode} />

      <ConfirmDialog
        open={emptyConfirmOpen}
        title="Звільнити тару?"
        description="Поточне заповнення буде завершено. Після цього тару можна заповнити знову."
        confirmLabel="Звільнити"
        cancelLabel="Скасувати"
        variant="default"
        onConfirm={handleEmpty}
        onCancel={() => setEmptyConfirmOpen(false)}
        loading={actionLoading}
      />

      {isAdmin && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Видалити тару?"
          description={`Тару ${containerCode} буде видалено без можливості відновлення.`}
          confirmLabel="Видалити"
          cancelLabel="Скасувати"
          variant="destructive"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
