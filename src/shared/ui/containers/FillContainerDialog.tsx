// src/shared/ui/containers/FillContainerDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fillContainer } from "@/shared/api/containers";
import { getProducts } from "@/shared/api/products";
import type { ContainerDto, FillContainerDto, ProductDto } from "@/shared/types";
import { toast } from "sonner";

interface FillContainerDialogProps {
  container: ContainerDto;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Add days/hours to YYYY-MM-DD in local time, return YYYY-MM-DD
function addShelfLife(baseYmd: string, days: number, hours: number) {
  // Parse as local date at midnight
  const [y, m, d] = baseYmd.split("-").map((x) => Number(x));
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);

  if (Number.isFinite(days) && days) dt.setDate(dt.getDate() + days);
  if (Number.isFinite(hours) && hours) dt.setHours(dt.getHours() + hours);

  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function FillContainerDialog({
  container,
  open,
  onClose,
  onSuccess,
}: FillContainerDialogProps) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [productIdStr, setProductIdStr] = useState<string>("");
  const [quantityStr, setQuantityStr] = useState<string>("");
  const [unit, setUnit] = useState<string>(container.unit ?? "");
  const [productionDate, setProductionDate] = useState<string>(todayYmd());
  const [expirationDate, setExpirationDate] = useState<string>(""); // empty => null

  useEffect(() => {
    if (!open) return;

    // reset on open
    setLoading(false);
    setProducts([]);
    setProductIdStr("");
    setQuantityStr(String(container.volume ?? ""));
    setUnit(container.unit ?? "");
    setProductionDate(todayYmd());
    setExpirationDate("");

    getProducts()
      .then(setProducts)
      .catch(() => toast.error("Не вдалося завантажити продукти"));
  }, [open, container.volume, container.unit]);

  const selectedProduct = useMemo(() => {
    const pid = Number(productIdStr);
    if (!Number.isFinite(pid) || pid <= 0) return null;
    return products.find((p) => p.id === pid) ?? null;
  }, [productIdStr, products]);

  // Auto-calc expiration date if product has shelf life
  useEffect(() => {
    if (!selectedProduct) return;

    const days = selectedProduct.shelfLifeDays ?? 0;
    const hours = selectedProduct.shelfLifeHours ?? 0;
    const hasShelf = !!(days || hours);
    if (!hasShelf) return;

    if (!productionDate) return;

    setExpirationDate(addShelfLife(productionDate, days, hours));
  }, [selectedProduct, productionDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pid = Number(productIdStr);
    if (!Number.isFinite(pid) || pid <= 0) {
      toast.error("Оберіть продукт");
      return;
    }

    const quantity = Number(quantityStr);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Кількість має бути більше 0");
      return;
    }

    if (!unit.trim()) {
      toast.error("Вкажіть одиницю виміру");
      return;
    }

    if (!productionDate) {
      toast.error("Вкажіть дату виробництва");
      return;
    }

    const payload: FillContainerDto = {
      productId: pid,
      quantity,
      unit: unit.trim() || null,
      productionDate, // YYYY-MM-DD
      expirationDate: expirationDate ? expirationDate : null, // YYYY-MM-DD | null
    };

    setLoading(true);
    try {
      await fillContainer(container.id, payload);
      toast.success("Контейнер заповнено");
      onSuccess();
      onClose();
    } catch {
      toast.error("Не вдалося заповнити контейнер");
    } finally {
      setLoading(false);
    }
  };

  const hasShelfLife =
    !!selectedProduct && !!(selectedProduct.shelfLifeDays || selectedProduct.shelfLifeHours);

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Заповнити контейнер {container.code ?? ""}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Продукт</Label>
            <Select value={productIdStr} onValueChange={setProductIdStr}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Оберіть продукт" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name ?? "—"}
                    {p.productTypeName ? ` (${p.productTypeName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Кількість</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Одиниця</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productionDate">Дата виробництва</Label>
            <Input
              id="productionDate"
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDate">Термін придатності</Label>
            <Input
              id="expirationDate"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
            {hasShelfLife ? (
              <p className="text-xs text-muted-foreground">
                Автоматично розраховано з терміну придатності продукту (можна змінити вручну).
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Скасувати
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Збереження..." : "Заповнити"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
