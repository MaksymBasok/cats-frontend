"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Download,
  Droplets,
  Edit,
  Package2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as containersApi from "@/shared/api/containers";
import { ApiError } from "@/shared/api/client";
import { useAuth } from "@/shared/auth/AuthProvider";
import type { ContainerDto, ContainerFillDto, ContainerStatus } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { QrGeneratorDialog } from "@/shared/ui/QrGeneratorDialog";
import { FillContainerDialog } from "@/shared/ui/containers/FillContainerDialog";
import { EditFillDialog } from "@/shared/ui/containers/EditFillDialog";
import { showErrorToast } from "@/shared/utils/errors";

function safeParam(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param[0] : param;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  return format(new Date(value), "dd.MM.yyyy");
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  return format(new Date(value), "dd.MM.yyyy HH:mm");
}

function getStatusCopy(status: ContainerStatus | null) {
  if (status === "Full") {
    return {
      label: "Заповнена",
      dotClass: "bg-emerald-500",
      badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  return {
    label: "Порожня",
    dotClass: "bg-slate-400",
    badgeClass: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  };
}

export default function ContainerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const code = safeParam(params.code as string | string[] | undefined);
  const hasCode = code.trim().length > 0;

  const [container, setContainer] = useState<ContainerDto | null>(null);
  const [history, setHistory] = useState<ContainerFillDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fillOpen, setFillOpen] = useState(false);
  const [editFillOpen, setEditFillOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [historyLoadFailed, setHistoryLoadFailed] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

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

  const fetchContainerData = useCallback(async () => {
    if (!hasCode) {
      setLoading(false);
      setLoadError(null);
      setContainer(null);
      setHistory([]);
      setHistoryLoadFailed(false);
      setHistoryLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError(null);

      const containerData = await containersApi.getContainerByCode(code);
      setContainer(containerData);
      await fetchHistory(containerData.id);
    } catch (error) {
      setContainer(null);
      setHistory([]);
      setHistoryLoadFailed(false);
      setHistoryLoading(false);
      setLoadError("Не вдалося завантажити дані тари.");

      if (!(error instanceof ApiError && error.status === 404)) {
        showErrorToast(error, "Не вдалося завантажити дані тари");
      }
    } finally {
      setLoading(false);
    }
  }, [code, fetchHistory, hasCode]);

  useEffect(() => {
    void fetchContainerData();
  }, [fetchContainerData]);

  useEffect(() => {
    setMobileHistoryOpen(false);
  }, [container?.id]);

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

  const qrUrl = useMemo(() => {
    if (!container || typeof window === "undefined") return "";
    const containerCode = container.code ?? code;
    return `${window.location.origin}/containers/${encodeURIComponent(containerCode)}`;
  }, [container, code]);

  const containerCode = container?.code ?? code;
  const statusCopy = getStatusCopy(container?.status ?? null);
  const isFull = container?.status === "Full";
  const isEmpty = !isFull;

  const hasCurrentContent =
    isFull &&
    (container?.currentProductName != null ||
      container?.currentQuantity != null ||
      container?.currentProductionDate != null ||
      container?.currentExpirationDate != null);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="glass animate-fade-in-up flex items-center gap-3 rounded-3xl px-6 py-5 shadow-[var(--luxury-shadow)]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <span className="text-sm font-medium text-muted-foreground">Завантажуємо дані тари...</span>
        </div>
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

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="md:hidden">
        <Button variant="outline" onClick={() => router.push("/containers")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          До списку тари
        </Button>
      </div>

      <section className="glass animate-fade-in-up relative overflow-hidden rounded-[28px] border border-primary/10 bg-card/80 p-6 shadow-[var(--luxury-shadow)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-16 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/containers")}
                className="hidden md:inline-flex"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[var(--neon-glow)]">
                    <Package2 className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-3xl font-semibold tracking-tight">{containerCode}</h1>
                      <Badge variant="outline" className={`gap-2 px-3 py-1 text-sm font-semibold ${statusCopy.badgeClass}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${statusCopy.dotClass}`} />
                        {statusCopy.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Створено {formatDate(container.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {isEmpty ? (
                <Button onClick={() => setFillOpen(true)} disabled={actionLoading} className="gap-2">
                  <Droplets className="h-4 w-4" />
                  Заповнити
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setEditFillOpen(true)} disabled={actionLoading} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Редагувати
                  </Button>
                  <Button variant="outline" onClick={() => setEmptyConfirmOpen(true)} disabled={actionLoading} className="gap-2">
                    <X className="h-4 w-4" />
                    Звільнити
                  </Button>
                </>
              )}

              <Button variant="outline" onClick={() => setQrOpen(true)} disabled={actionLoading} className="gap-2">
                <Download className="h-4 w-4" />
                QR-код
              </Button>

              {isAdmin ? (
                <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)} disabled={actionLoading} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Видалити
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="stylish-card animate-fade-in-up">
          <CardHeader>
            <CardTitle>Параметри тари</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Код</p>
              <p className="mt-1 text-lg font-semibold">{containerCode}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Назва</p>
              <p className="mt-1 text-lg font-semibold">{container.name ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Об&rsquo;єм</p>
              <p className="mt-1 text-lg font-semibold">
                {container.volume} {container.unit ?? ""}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Тип</p>
              <p className="mt-1 text-lg font-semibold">{container.containerTypeName ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Створив</p>
              <p className="mt-1 text-base font-semibold">{container.createdByName ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Останнє оновлення</p>
              <p className="mt-1 text-base font-semibold">{formatDateTime(container.updatedAt ?? container.createdAt)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Змінено: {container.lastModifiedByName ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 sm:col-span-2 xl:col-span-3">
              <p className="text-sm text-muted-foreground">Примітки</p>
              <p className="mt-1 text-base">{container.meta?.trim() || "Немає приміток."}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="stylish-card animate-fade-in-up">
          <CardHeader>
            <CardTitle>Поточний вміст</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasCurrentContent ? (
              <>
                <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                  <p className="text-sm text-muted-foreground">Продукт</p>
                  <p className="mt-1 text-xl font-semibold">{container.currentProductName ?? "-"}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="text-sm text-muted-foreground">Кількість</p>
                    <p className="mt-1 text-base font-semibold">
                      {container.currentQuantity ?? "-"} {container.unit ?? ""}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="text-sm text-muted-foreground">Заповнено</p>
                    <p className="mt-1 text-base font-semibold">{formatDateTime(container.currentFilledAt)}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="text-sm text-muted-foreground">Дата виробництва</p>
                    <p className="mt-1 text-base font-semibold">{formatDate(container.currentProductionDate)}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="text-sm text-muted-foreground">Термін придатності</p>
                    <p className="mt-1 text-base font-semibold">{formatDate(container.currentExpirationDate)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-background/60 p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <p className="mt-4 text-base font-semibold">Тара зараз порожня</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Після заповнення тут з&rsquo;являться дані про продукт, дату виробництва та термін придатності.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="stylish-card animate-fade-in-up">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Історія заповнень</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 md:hidden"
              onClick={() => setMobileHistoryOpen((value) => !value)}
            >
              {mobileHistoryOpen ? "Сховати" : "Показати"}
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileHistoryOpen ? "rotate-180" : ""}`} />
            </Button>
            {historyLoadFailed ? (
              <Button variant="outline" size="sm" onClick={() => void fetchHistory(container.id)} disabled={historyLoading}>
                Повторити
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className={mobileHistoryOpen ? undefined : "hidden md:block"}>
          {historyLoadFailed ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              Не вдалося завантажити історію вмісту.
            </div>
          ) : historyLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-5">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <p className="text-sm text-muted-foreground">Завантажуємо історію...</p>
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-4">
              {history.map((fill, index) => (
                <div
                  key={fill.id}
                  className="relative overflow-hidden rounded-3xl border border-border/80 bg-background/70 p-5 shadow-sm"
                >
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary to-cyan-400" />
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Заповнення #{history.length - index}</Badge>
                        <h3 className="text-lg font-semibold">{fill.productName ?? "-"}</h3>
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <p>
                          Кількість: <span className="font-medium text-foreground">{fill.quantity} {fill.unit ?? ""}</span>
                        </p>
                        <p>
                          Заповнено: <span className="font-medium text-foreground">{formatDateTime(fill.filledDate)}</span>
                        </p>
                        <p>
                          Вироблено: <span className="font-medium text-foreground">{formatDate(fill.productionDate)}</span>
                        </p>
                        <p>
                          Придатне до: <span className="font-medium text-foreground">{formatDate(fill.expirationDate)}</span>
                        </p>
                        <p>
                          Наповнив: <span className="font-medium text-foreground">{fill.filledByUserName ?? "-"}</span>
                        </p>
                        <p>
                          Спорожнив: <span className="font-medium text-foreground">{fill.emptiedByUserName ?? "-"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="min-w-[170px] rounded-2xl border border-border/70 bg-card/80 p-4 text-sm">
                      <p className="text-muted-foreground">Статус запису</p>
                      <p className="mt-1 font-semibold">
                        {fill.emptiedDate ? "Завершено" : "Активне заповнення"}
                      </p>
                      <p className="mt-2 text-muted-foreground">
                        {fill.emptiedDate ? `Звільнено ${formatDateTime(fill.emptiedDate)}` : "Ще не звільнено"}
                      </p>
                      <p className="mt-2 text-muted-foreground">
                        Оператор: {fill.emptiedDate ? fill.emptiedByUserName ?? "-" : fill.filledByUserName ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-background/60 p-8 text-center">
              <p className="text-base font-semibold">Історія заповнень поки порожня</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Після першого заповнення тут з&rsquo;являться всі зміни вмісту цієї тари.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isEmpty ? (
        <FillContainerDialog
          container={container}
          open={fillOpen}
          onClose={() => setFillOpen(false)}
          onSuccess={fetchContainerData}
        />
      ) : (
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
        description="Поточне заповнення буде завершено. Після цього тару можна буде заповнити повторно."
        confirmLabel="Звільнити"
        cancelLabel="Скасувати"
        variant="default"
        onConfirm={handleEmpty}
        onCancel={() => setEmptyConfirmOpen(false)}
        loading={actionLoading}
      />

      {isAdmin ? (
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
      ) : null}
    </div>
  );
}
