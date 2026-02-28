"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fillContainer } from "@/shared/api/containers";
import { getProducts } from "@/shared/api/products";
import { getContainerTypes } from "@/shared/api/container-types";
import type { ContainerDto, ContainerTypeDto, FillContainerDto, ProductDto } from "@/shared/types";
import { toast } from "sonner";
import { normalizeUnit } from "@/shared/constants/units";
import { showErrorToast, showValidationToast } from "@/shared/utils/errors";
import { validateFillContainer } from "@/shared/utils/form-validation";

interface FillContainerDialogProps {
  container: ContainerDto;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function todayYmd() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addShelfLife(baseYmd: string, days: number, hours: number) {
  const [year, month, day] = baseYmd.split("-").map((value) => Number(value));
  const date = new Date(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0);

  if (Number.isFinite(days) && days) date.setDate(date.getDate() + days);
  if (Number.isFinite(hours) && hours) date.setHours(date.getHours() + hours);

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function FillContainerDialog({
  container,
  open,
  onClose,
  onSuccess,
}: FillContainerDialogProps) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [containerTypes, setContainerTypes] = useState<ContainerTypeDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [productIdStr, setProductIdStr] = useState("");
  const [quantityStr, setQuantityStr] = useState("");
  const unit = normalizeUnit(container.unit);
  const [productionDate, setProductionDate] = useState(todayYmd());
  const [expirationDate, setExpirationDate] = useState("");

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
    setProductIdStr("");
    setQuantityStr(String(container.volume ?? ""));
    setProductionDate(todayYmd());
    setExpirationDate("");

    Promise.all([getProducts(), getContainerTypes()])
      .then(([productItems, containerTypeItems]) => {
        setProducts(productItems);
        setContainerTypes(containerTypeItems);
      })
      .catch((error) => showErrorToast(error, "Не вдалося завантажити продукти"));
  }, [open, container.containerTypeId, container.volume]);

  useEffect(() => {
    if (!open) return;
    if (filteredProducts.length === 1) {
      setProductIdStr(String(filteredProducts[0].id));
      return;
    }
    if (productIdStr && !filteredProducts.some((product) => String(product.id) === productIdStr)) {
      setProductIdStr("");
    }
  }, [filteredProducts, open, productIdStr]);

  const selectedProduct = useMemo(() => {
    const productId = Number(productIdStr);
    if (!Number.isFinite(productId) || productId <= 0) return null;
    return filteredProducts.find((product) => product.id === productId) ?? null;
  }, [filteredProducts, productIdStr]);

  useEffect(() => {
    if (!selectedProduct) return;

    const days = selectedProduct.shelfLifeDays ?? 0;
    const hours = selectedProduct.shelfLifeHours ?? 0;
    const hasShelfLife = !!(days || hours);
    if (!hasShelfLife || !productionDate) return;

    setExpirationDate(addShelfLife(productionDate, days, hours));
  }, [selectedProduct, productionDate]);

  const hasShelfLife =
    !!selectedProduct && !!(selectedProduct.shelfLifeDays || selectedProduct.shelfLifeHours);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (filteredProducts.length === 0) {
      showValidationToast(["Для цього типу тари немає доступних продуктів."]);
      return;
    }

    const result = validateFillContainer({
      productId: productIdStr,
      quantity: quantityStr,
      unit,
      productionDate,
      expirationDate,
      requireExpirationDate: !hasShelfLife,
    });

    if (!result.success) {
      showValidationToast(result.issues);
      return;
    }

    const payload: FillContainerDto = result.data;

    setLoading(true);
    try {
      await fillContainer(container.id, payload);
      toast.success("Контейнер заповнено");
      onSuccess();
      onClose();
    } catch (error) {
      showErrorToast(error, "Не вдалося заповнити контейнер");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
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
                {filteredProducts.map((product) => (
                  <SelectItem key={product.id} value={String(product.id)}>
                    {product.name ?? "-"}
                    {product.productTypeName ? ` (${product.productTypeName})` : ""}
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
            />
            {hasShelfLife ? (
              <p className="text-xs text-muted-foreground">
                Дата придатності розрахована автоматично з терміну придатності продукту, але її можна змінити вручну.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Для цього продукту потрібно вказати термін придатності вручну.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Одиниця фіксована налаштуванням тари та не редагується у цій формі.
            </p>
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
