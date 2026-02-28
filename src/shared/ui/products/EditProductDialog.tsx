"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProduct } from "@/shared/api/products";
import type { ProductDto, ProductTypeDto, UpdateProductDto } from "@/shared/types";
import { toast } from "sonner";
import { showErrorToast, showValidationToast } from "@/shared/utils/errors";
import { validateUpdateProduct } from "@/shared/utils/form-validation";

interface EditProductDialogProps {
  product: ProductDto;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  productTypes: ProductTypeDto[];
}

type FormState = {
  name: string;
  description: string;
  productTypeId: string;
  shelfLifeDays: string;
  shelfLifeHours: string;
};

function numToStr(value: number | null | undefined) {
  return value == null ? "" : String(value);
}

export function EditProductDialog({
  product,
  open,
  onClose,
  onUpdated,
  productTypes,
}: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);

  const productTypeById = useMemo(
    () => new Map(productTypes.map((type) => [String(type.id), type])),
    [productTypes],
  );

  const applyTypeDefaults = (typeId: string) => {
    const selectedType = productTypeById.get(typeId);
    return {
      productTypeId: typeId,
      shelfLifeDays: selectedType?.shelfLifeDays != null ? String(selectedType.shelfLifeDays) : "",
      shelfLifeHours: selectedType?.shelfLifeHours != null ? String(selectedType.shelfLifeHours) : "",
    };
  };

  const [form, setForm] = useState<FormState>({
    name: product.name ?? "",
    description: product.description ?? "",
    productTypeId: product.productTypeId != null ? String(product.productTypeId) : "",
    shelfLifeDays: numToStr(product.shelfLifeDays),
    shelfLifeHours: numToStr(product.shelfLifeHours),
  });

  useEffect(() => {
    if (!open) return;
    setLoading(false);
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      productTypeId: product.productTypeId != null ? String(product.productTypeId) : "",
      shelfLifeDays: numToStr(product.shelfLifeDays),
      shelfLifeHours: numToStr(product.shelfLifeHours),
    });
  }, [open, product]);

  const buildDto = (): UpdateProductDto | null => {
    const result = validateUpdateProduct({
      name: form.name,
      description: form.description,
      productTypeId: form.productTypeId,
      shelfLifeDays: form.shelfLifeDays,
      shelfLifeHours: form.shelfLifeHours,
    });

    if (!result.success) {
      showValidationToast(result.issues);
      return null;
    }

    return result.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dto = buildDto();
    if (!dto) return;

    setLoading(true);
    try {
      await updateProduct(product.id, dto);
      toast.success("Продукт оновлено");
      onUpdated();
      onClose();
    } catch (error) {
      showErrorToast(error, "Не вдалося оновити продукт");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редагувати продукт</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Назва</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productType">Тип продукту</Label>
            <Select
              value={form.productTypeId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, ...applyTypeDefaults(value) }))}
            >
              <SelectTrigger id="productType">
                <SelectValue placeholder="Оберіть тип продукту" />
              </SelectTrigger>
              <SelectContent>
                {productTypes.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name ?? "-"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Опис (необов&rsquo;язково)</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shelfLifeDays">Термін (днів)</Label>
              <Input
                id="shelfLifeDays"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.shelfLifeDays}
                onChange={(e) => setForm((prev) => ({ ...prev, shelfLifeDays: e.target.value }))}
                placeholder="-"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shelfLifeHours">Термін (годин)</Label>
              <Input
                id="shelfLifeHours"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.shelfLifeHours}
                onChange={(e) => setForm((prev) => ({ ...prev, shelfLifeHours: e.target.value }))}
                placeholder="-"
              />
            </div>
          </div>

          <p className="-mt-2 text-xs text-muted-foreground">
            При зміні типу продукту значення терміну придатності автоматично підтягуються з типу.
          </p>

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
