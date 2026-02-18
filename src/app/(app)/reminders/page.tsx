"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, format, isBefore, parseISO } from "date-fns";
import { showErrorToast } from "@/shared/utils/errors";
import { getContainers, searchContainerFills } from "@/shared/api/containers";
import { getProducts } from "@/shared/api/products";
import type { ContainerFillDto, ContainerDto, ProductDto } from "@/shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

function toApiDateTime(dateValue: string, endOfDay = false): string | undefined {
  if (!dateValue) return undefined;
  const parsed = new Date(`${dateValue}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function parseIsoSafely(value: string): Date | null {
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function RemindersPage() {
  const [fills, setFills] = useState<ContainerFillDto[]>([]);
  const [containers, setContainers] = useState<ContainerDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selectedContainer, setSelectedContainer] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const isDateRangeInvalid = useMemo(() => {
    return Boolean(fromDate && toDate && fromDate > toDate);
  }, [fromDate, toDate]);

  const load = useCallback(async () => {
    if (isDateRangeInvalid) {
      setFills([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [fillsData, containersData, productsData] = await Promise.all([
        searchContainerFills({
          onlyActive: true,
          fromDate: toApiDateTime(fromDate),
          toDate: toApiDateTime(toDate, true),
        }),
        getContainers(),
        getProducts(),
      ]);
      setFills(fillsData);
      setContainers(containersData);
      setProducts(productsData);
    } catch (error) {
      showErrorToast(error, "Не вдалося завантажити технологічні дати");
    } finally {
      setLoading(false);
    }
  }, [fromDate, isDateRangeInvalid, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return fills
      .filter((f) => (selectedContainer === "all" ? true : String(f.containerId) === selectedContainer))
      .filter((f) => (selectedProduct === "all" ? true : String(f.productId) === selectedProduct))
      .sort((a, b) => {
        const first = parseIsoSafely(a.expirationDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const second = parseIsoSafely(b.expirationDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return first - second;
      });
  }, [fills, selectedContainer, selectedProduct]);

  const expiredCount = useMemo(() => {
    return filtered.reduce((acc, item) => {
      const expiresAt = parseIsoSafely(item.expirationDate);
      if (!expiresAt) return acc;
      return isBefore(expiresAt, new Date()) ? acc + 1 : acc;
    }, 0);
  }, [filtered]);

  const dueTodayCount = useMemo(() => {
    return filtered.reduce((acc, item) => {
      const expiresAt = parseIsoSafely(item.expirationDate);
      if (!expiresAt) return acc;
      return differenceInCalendarDays(expiresAt, new Date()) === 0 ? acc + 1 : acc;
    }, 0);
  }, [filtered]);

  const nearestExpiration = useMemo(() => {
    const dates = filtered
      .map((item) => parseIsoSafely(item.expirationDate))
      .filter((value): value is Date => value !== null);
    return dates.length > 0 ? dates[0] : null;
  }, [filtered]);
  const hasActiveFilters =
    selectedContainer !== "all" ||
    selectedProduct !== "all" ||
    Boolean(fromDate) ||
    Boolean(toDate);

  const clearFilters = () => {
    setSelectedContainer("all");
    setSelectedProduct("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h1 className="text-3xl font-bold">Технологічні дати</h1>
          {!loading && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>
                В роботі: <span className="font-semibold text-foreground">{filtered.length}</span>
              </span>
              <span>
                Прострочено: <span className="font-semibold text-destructive">{expiredCount}</span>
              </span>
              <span>
                Сьогодні: <span className="font-semibold text-foreground">{dueTodayCount}</span>
              </span>
              <span>
                Найближчий дедлайн:{" "}
                <span className="font-semibold text-foreground">
                  {nearestExpiration ? format(nearestExpiration, "dd.MM.yyyy HH:mm") : "—"}
                </span>
              </span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">Моніторинг активних заповнень та контроль термінів придатності.</p>
      </div>


      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Список нагадувань</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen((v) => !v)}
            className={hasActiveFilters ? "border-brand-orange text-brand-orange dark:border-brand-orange dark:text-brand-orange" : ""}
          >
            <Filter className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{filtersOpen ? "Сховати" : "Фільтри"}</span>
          </Button>
        </CardHeader>
        {filtersOpen && (
          <div className="border-t border-border px-4 pb-4 pt-3">
            <div className="grid gap-3 md:grid-cols-4">
            <Select value={selectedContainer} onValueChange={setSelectedContainer}>
              <SelectTrigger>
                <SelectValue placeholder="Уся тара" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Уся тара</SelectItem>
                {containers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.code ?? `#${c.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Усі продукти" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі продукти</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name ?? `#${p.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            {isDateRangeInvalid && (
              <p className="mt-2 text-sm text-destructive">
                Дата &quot;Від&quot; не може бути пізніше за дату &quot;До&quot;.
              </p>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" /> Скинути фільтри
              </button>
            )}
          </div>
        )}
        <CardContent className="space-y-3 pt-0">
          {loading ? (
            <p className="text-sm text-muted-foreground">Завантаження...</p>
          ) : isDateRangeInvalid ? (
            <p className="text-sm text-destructive">Виправте діапазон дат, щоб побачити записи.</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Немає записів.</p>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Тара / продукт</TableHead>
                      <TableHead>Партія</TableHead>
                      <TableHead>Дата наповнення</TableHead>
                      <TableHead>Термін придатності</TableHead>
                      <TableHead className="text-right">Залишок</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => {
                      const expires = parseIsoSafely(row.expirationDate);
                      const filledAt = parseIsoSafely(row.filledDate);
                      const daysLeft = expires ? differenceInCalendarDays(expires, new Date()) : null;
                      const expired = daysLeft != null && daysLeft < 0;
                      const soon = daysLeft != null && daysLeft >= 0 && daysLeft <= 3;

                      return (
                        <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
                          <TableCell className="font-medium">Тара {row.containerCode ?? `#${row.containerId}`} · {row.productName}</TableCell>
                          <TableCell>{row.quantity} {row.unit}</TableCell>
                          <TableCell className="text-muted-foreground">{filledAt ? format(filledAt, "dd.MM.yyyy HH:mm") : "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{expires ? format(expires, "dd.MM.yyyy HH:mm") : "—"}</TableCell>
                          <TableCell className="text-right font-medium">
                            {daysLeft == null ? "—" : daysLeft < 0 ? `${Math.abs(daysLeft)} дн. тому` : `${daysLeft} дн.`}
                          </TableCell>
                          <TableCell>
                            <Badge variant={expired ? "destructive" : soon ? "secondary" : "outline"}>
                              {expired ? "Прострочено" : soon ? "Термін скоро" : "Нормально"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 md:hidden">
                {filtered.map((row) => {
                  const expires = parseIsoSafely(row.expirationDate);
                  const filledAt = parseIsoSafely(row.filledDate);
                  const daysLeft = expires ? differenceInCalendarDays(expires, new Date()) : null;
                  const expired = daysLeft != null && daysLeft < 0;
                  const soon = daysLeft != null && daysLeft >= 0 && daysLeft <= 3;

                  return (
                    <div key={row.id} className="space-y-1 rounded-xl border bg-card p-4 text-sm shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">Тара {row.containerCode ?? `#${row.containerId}`} · {row.productName}</p>
                        <Badge variant={expired ? "destructive" : soon ? "secondary" : "outline"}>
                          {expired ? "Прострочено" : soon ? "Термін скоро" : "Нормально"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">Партія: {row.quantity} {row.unit}</p>
                      <p className="text-muted-foreground">Дата наповнення: {filledAt ? format(filledAt, "dd.MM.yyyy HH:mm") : "—"}</p>
                      <p className="text-muted-foreground">Термін придатності: {expires ? format(expires, "dd.MM.yyyy HH:mm") : "—"}</p>
                      <p className="font-medium">
                        Залишок: {daysLeft == null ? "—" : daysLeft < 0 ? `${Math.abs(daysLeft)} дн. тому` : `${daysLeft} дн.`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
