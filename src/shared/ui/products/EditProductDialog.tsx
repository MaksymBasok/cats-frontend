// src/shared/ui/products/EditProductDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProduct } from "@/shared/api/products";
import type { ProductDto, UpdateProductDto, ProductTypeDto } from "@/shared/types";
import { toast } from "sonner";

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
  productTypeId: string; // select value (string)
  shelfLifeDays: string; // strings to avoid NaN during typing
  shelfLifeHours: string;
};

function numToStr(v: number | null | undefined) {
  return v == null ? "" : String(v);
}

export function EditProductDialog({
  product,
  open,
  onClose,
  onUpdated,
  productTypes,
}: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);

  const productTypeIds = useMemo(() => new Set(productTypes.map((t) => t.id)), [productTypes]);

  const [form, setForm] = useState<FormState>({
    name: product.name ?? "",
    description: product.description ?? "",
    productTypeId: product.productTypeId != null ? String(product.productTypeId) : "",
    shelfLifeDays: numToStr(product.shelfLifeDays),
    shelfLifeHours: numToStr(product.shelfLifeHours),
  });

  // Re-init when dialog opens or product changes (important when editing different rows)
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
    const name = form.name.trim();
    if (!name) {
      toast.error("Вкажіть назву");
      return null;
    }

    const ptId = form.productTypeId ? Number(form.productTypeId) : NaN;
    if (!Number.isFinite(ptId) || !productTypeIds.has(ptId)) {
      toast.error("Оберіть тип продукту");
      return null;
    }

    const days = form.shelfLifeDays.trim() ? Number(form.shelfLifeDays) : null;
    const hours = form.shelfLifeHours.trim() ? Number(form.shelfLifeHours) : null;

    if (days != null && (!Number.isFinite(days) || days < 0)) {
      toast.error("Термін (днів) має бути числом ≥ 0");
      return null;
    }
    if (hours != null && (!Number.isFinite(hours) || hours < 0)) {
      toast.error("Термін (годин) має бути числом ≥ 0");
      return null;
    }

    const dto: UpdateProductDto = {
      name,
      description: form.description.trim() ? form.description.trim() : null,
      productTypeId: ptId,
      shelfLifeDays: days == null ? null : Math.trunc(days),
      shelfLifeHours: hours == null ? null : Math.trunc(hours),
    };

    return dto;
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
    } catch {
      toast.error("Не вдалося оновити продукт");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
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
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productType">Тип продукту</Label>
            <Select value={form.productTypeId} onValueChange={(v) => setForm((p) => ({ ...p, productTypeId: v }))}>
              <SelectTrigger id="productType">
                <SelectValue placeholder="Оберіть тип продукту" />
              </SelectTrigger>
              <SelectContent>
                {productTypes.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name ?? "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Опис (опціонально)</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
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
                onChange={(e) => setForm((p) => ({ ...p, shelfLifeDays: e.target.value }))}
                placeholder="—"
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
                onChange={(e) => setForm((p) => ({ ...p, shelfLifeHours: e.target.value }))}
                placeholder="—"
              />
            </div>
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
