"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, format, isBefore, parseISO } from "date-fns";
import { toast } from "sonner";
import { searchContainerFills } from "@/shared/api/containers";
import { getProducts } from "@/shared/api/products";
import { getContainers } from "@/shared/api/containers";
import type { ContainerFillDto, ContainerDto, ProductDto } from "@/shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BellRing, CalendarClock, TriangleAlert } from "lucide-react";

export default function RemindersPage() {
  const [fills, setFills] = useState<ContainerFillDto[]>([]);
  const [containers, setContainers] = useState<ContainerDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

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
        <StatCard title="Заповниться / дозріє сьогодні" value={filtered.filter((f) => differenceInCalendarDays(parseISO(f.expirationDate), new Date()) === 0).length} icon={CalendarClock} />
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
            filtered.map((row) => {
              const expires = parseISO(row.expirationDate);
              const daysLeft = differenceInCalendarDays(expires, new Date());
              const expired = daysLeft < 0;
              const soon = daysLeft >= 0 && daysLeft <= 3;

              return (
                <div key={row.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">Тара {row.containerCode ?? `#${row.containerId}`} · {row.productName}</p>
                    <Badge variant={expired ? "destructive" : soon ? "secondary" : "outline"}>
                      {expired ? "Прострочено" : soon ? `Залишилось ${daysLeft} дн.` : "Нормально"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Обсяг: {row.quantity} {row.unit} · Дата наповнення: {format(parseISO(row.filledDate), "dd.MM.yyyy HH:mm")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Термін придатності: {format(expires, "dd.MM.yyyy HH:mm")}
                  </p>
                </div>
              );
            })
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
    <Card>
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
