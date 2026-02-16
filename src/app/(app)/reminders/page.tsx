"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, format, isBefore, parseISO } from "date-fns";
import { toast } from "sonner";
import { getContainers, searchContainerFills } from "@/shared/api/containers";
import { getProducts } from "@/shared/api/products";
import type { ContainerFillDto, ContainerDto, ProductDto } from "@/shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BellRing, CalendarClock, TriangleAlert, ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function RemindersPage() {
  const [fills, setFills] = useState<ContainerFillDto[]>([]);
  const [containers, setContainers] = useState<ContainerDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCardId, setOpenCardId] = useState<number | null>(null);

  const [selectedContainer, setSelectedContainer] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fillsData, containersData, productsData] = await Promise.all([
        searchContainerFills({ onlyActive: true, fromDate: fromDate || undefined, toDate: toDate || undefined }),
        getContainers(),
        getProducts(),
      ]);
      setFills(fillsData);
      setContainers(containersData);
      setProducts(productsData);
    } catch {
      toast.error("Не вдалося завантажити технологічні дати");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return fills
      .filter((f) => (selectedContainer === "all" ? true : String(f.containerId) === selectedContainer))
      .filter((f) => (selectedProduct === "all" ? true : String(f.productId) === selectedProduct))
      .sort((a, b) => +new Date(a.expirationDate) - +new Date(b.expirationDate));
  }, [fills, selectedContainer, selectedProduct]);

  const expiredCount = filtered.filter((f) => isBefore(parseISO(f.expirationDate), new Date())).length;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold">Технологічні дати</h1>
        <p className="text-muted-foreground">Моніторинг активних заповнень та контроль термінів придатності.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Активних заповнень" value={filtered.length} icon={BellRing} />
        <StatCard title="Прострочено" value={expiredCount} icon={TriangleAlert} />
        <StatCard
          title="Заповниться / дозріє сьогодні"
          value={filtered.filter((f) => differenceInCalendarDays(parseISO(f.expirationDate), new Date()) === 0).length}
          icon={CalendarClock}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фільтри</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Select value={selectedContainer} onValueChange={setSelectedContainer}>
            <SelectTrigger><SelectValue placeholder="Уся тара" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Уся тара</SelectItem>
              {containers.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.code ?? `#${c.id}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger><SelectValue placeholder="Усі продукти" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Усі продукти</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name ?? `#${p.id}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список нагадувань</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Завантаження...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Немає записів.</p>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Тара / продукт</TableHead>
                      <TableHead>Обсяг</TableHead>
                      <TableHead>Дата наповнення</TableHead>
                      <TableHead>Термін придатності</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => {
                      const expires = parseISO(row.expirationDate);
                      const daysLeft = differenceInCalendarDays(expires, new Date());
                      const expired = daysLeft < 0;
                      const soon = daysLeft >= 0 && daysLeft <= 3;

                      return (
                        <TableRow key={row.id} className="transition-colors hover:bg-muted/50">
                          <TableCell className="font-medium">Тара {row.containerCode ?? `#${row.containerId}`} · {row.productName}</TableCell>
                          <TableCell>{row.quantity} {row.unit}</TableCell>
                          <TableCell className="text-muted-foreground">{format(parseISO(row.filledDate), "dd.MM.yyyy HH:mm")}</TableCell>
                          <TableCell className="text-muted-foreground">{format(expires, "dd.MM.yyyy HH:mm")}</TableCell>
                          <TableCell>
                            <Badge variant={expired ? "destructive" : soon ? "secondary" : "outline"}>
                              {expired ? "Прострочено" : soon ? `Залишилось ${daysLeft} дн.` : "Нормально"}
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
                  const expires = parseISO(row.expirationDate);
                  const daysLeft = differenceInCalendarDays(expires, new Date());
                  const expired = daysLeft < 0;
                  const soon = daysLeft >= 0 && daysLeft <= 3;
                  const open = openCardId === row.id;

                  return (
                    <div key={row.id} className="rounded-xl border bg-card p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">Тара {row.containerCode ?? `#${row.containerId}`}</p>
                        <Badge variant={expired ? "destructive" : soon ? "secondary" : "outline"}>
                          {expired ? "Прострочено" : soon ? `Залишилось ${daysLeft} дн.` : "Нормально"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{row.productName}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        className="mt-2 h-8 px-2 text-xs"
                        onClick={() => setOpenCardId((prev) => (prev === row.id ? null : row.id))}
                      >
                        {open ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                        {open ? "Сховати деталі" : "Показати деталі"}
                      </Button>
                      {open && (
                        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                          <p>Обсяг: {row.quantity} {row.unit}</p>
                          <p>Дата наповнення: {format(parseISO(row.filledDate), "dd.MM.yyyy HH:mm")}</p>
                          <p>Термін придатності: {format(expires, "dd.MM.yyyy HH:mm")}</p>
                        </div>
                      )}
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

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const isExpired = title.toLowerCase().includes("прострочено");
  const isToday = title.toLowerCase().includes("сьогодні");

  return (
    <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${isExpired ? "text-destructive" : isToday ? "text-accent" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${isExpired ? "text-destructive" : isToday ? "text-accent" : ""}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
