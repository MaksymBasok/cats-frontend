// src/shared/ui/containers/EditFillDialog.tsx
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
import { updateContainerFill } from "@/shared/api/containers";
import { getProducts } from "@/shared/api/products";
import { getContainerTypes } from "@/shared/api/container-types";
import type { ContainerDto, ContainerTypeDto, ProductDto, UpdateContainerFillDto } from "@/shared/types";
import { toast } from "sonner";
import { normalizeUnit } from "@/shared/constants/units";
import { showErrorToast } from "@/shared/utils/errors";

interface EditFillDialogProps {
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

function toYmd(value?: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}

function addShelfLife(baseYmd: string, days: number, hours: number) {
  const [y, m, d] = baseYmd.split("-").map((x) => Number(x));
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);

  if (Number.isFinite(days) && days) dt.setDate(dt.getDate() + days);
  if (Number.isFinite(hours) && hours) dt.setHours(dt.getHours() + hours);

  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function EditFillDialog({ container, open, onClose, onSuccess }: EditFillDialogProps) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [containerTypes, setContainerTypes] = useState<ContainerTypeDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [productIdStr, setProductIdStr] = useState<string>(
    container.currentProductId != null ? String(container.currentProductId) : ""
  );
  const [quantityStr, setQuantityStr] = useState<string>(
    String(container.currentQuantity ?? container.volume ?? "")
  );
  const unit = normalizeUnit(container.unit);
  const [productionDate, setProductionDate] = useState<string>(
    toYmd(container.currentProductionDate) || todayYmd()
  );
  const [expirationDate, setExpirationDate] = useState<string>(
    toYmd(container.currentExpirationDate) || ""
  );

  const allowedProductTypeNames = useMemo(() => {
    const currentType = containerTypes.find((type) => type.id === container.containerTypeId);
    const names = currentType?.allowedProductTypeNames ?? null;
    if (!names || names.length === 0) return null;
    return new Set(names.map((name) => name.trim().toLowerCase()));
  }, [container.containerTypeId, containerTypes]);

  const filteredProducts = useMemo(() => {
    if (!allowedProductTypeNames) return products;
    return products.filter((product) =>
      allowedProductTypeNames.has((product.productTypeName ?? "").trim().toLowerCase()),
    );
  }, [allowedProductTypeNames, products]);

  useEffect(() => {
    if (!open) return;

    setLoading(false);
    setProducts([]);
    setContainerTypes([]);

    setProductIdStr(container.currentProductId != null ? String(container.currentProductId) : "");
    setQuantityStr(String(container.currentQuantity ?? container.volume ?? ""));
    setProductionDate(toYmd(container.currentProductionDate) || todayYmd());
    setExpirationDate(toYmd(container.currentExpirationDate) || "");

    Promise.all([getProducts(), getContainerTypes()])
      .then(([productItems, containerTypeItems]) => {
        setProducts(productItems);
        setContainerTypes(containerTypeItems);
      })
      .catch((error) => showErrorToast(error, "Не вдалося завантажити продукти"));
  }, [
    open,
    container.containerTypeId,
    container.currentProductId,
    container.currentQuantity,
    container.currentProductionDate,
    container.currentExpirationDate,
    container.volume,
  ]);

  useEffect(() => {
    if (!open) return;
    if (filteredProducts.length === 1) {
      setProductIdStr(String(filteredProducts[0].id));
      return;
    }
    if (productIdStr && !filteredProducts.some((product) => String(product.id) === productIdStr)) {
      setProductIdStr(filteredProducts[0] ? String(filteredProducts[0].id) : "");
    }
  }, [filteredProducts, open, productIdStr]);

  const selectedProduct = useMemo(() => {
    const pid = Number(productIdStr);
    if (!Number.isFinite(pid) || pid <= 0) return null;
    return filteredProducts.find((p) => p.id === pid) ?? null;
  }, [filteredProducts, productIdStr]);

  useEffect(() => {
    if (!selectedProduct) return;

    const days = selectedProduct.shelfLifeDays ?? 0;
    const hours = selectedProduct.shelfLifeHours ?? 0;
    const hasShelf = !!(days || hours);
    if (!hasShelf || !productionDate) return;

    setExpirationDate(addShelfLife(productionDate, days, hours));
  }, [selectedProduct, productionDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (filteredProducts.length === 0) {
      toast.error("Для цього типу тари немає доступних продуктів");
      return;
    }

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

    if (!productionDate) {
      toast.error("Вкажіть дату виробництва");
      return;
    }

    if (!expirationDate) {
      toast.error("Вкажіть термін придатності");
      return;
    }

    const payload: UpdateContainerFillDto = {
      productId: pid,
      quantity,
      unit,
      productionDate,
      expirationDate,
    };

    setLoading(true);
    try {
      await updateContainerFill(container.id, payload);
      toast.success("Вміст контейнера оновлено");
      onSuccess();
      onClose();
    } catch (error) {
      showErrorToast(error, "Не вдалося оновити вміст контейнера");
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
          <DialogTitle>Редагувати вміст контейнера {container.code ?? ""}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Продукт</Label>
            <Select value={productIdStr} onValueChange={setProductIdStr}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Оберіть продукт" />
              </SelectTrigger>
              <SelectContent>
                {filteredProducts.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name ?? "-"}
                    {p.productTypeName ? ` (${p.productTypeName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filteredProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Для цього типу тари немає доступних продуктів.
              </p>
            ) : null}
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
              <Input id="unit" value={unit || "-"} readOnly className="bg-muted text-muted-foreground" />
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
              required
            />
            {hasShelfLife ? (
              <p className="text-xs text-muted-foreground">
                Дата придатності розрахована автоматично з терміну придатності продукту (можна змінити вручну).
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Одиниця фіксована налаштуванням тари та не редагується у цій формі.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Скасувати
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Збереження..." : "Зберегти"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
