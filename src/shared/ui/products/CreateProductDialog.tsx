"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProduct } from "@/shared/api/products";
import type { CreateProductDto, ProductTypeDto } from "@/shared/types";
import { toast } from "sonner";
import { showErrorToast, showValidationToast } from "@/shared/utils/errors";
import { validateCreateProduct } from "@/shared/utils/form-validation";

interface CreateProductDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  productTypes: ProductTypeDto[];
}

type FormState = {
  name: string;
  description: string;
  productTypeId: string;
  shelfLifeDays: string;
  shelfLifeHours: string;
};

const initialForm: FormState = {
  name: "",
  description: "",
  productTypeId: "",
  shelfLifeDays: "",
  shelfLifeHours: "",
};

export function CreateProductDialog({
  open,
  onClose,
  onCreated,
  productTypes,
}: CreateProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);

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

  useEffect(() => {
    if (!open) return;
    setLoading(false);

    if (productTypes.length === 1) {
      const onlyType = productTypes[0];
      setForm({
        ...initialForm,
        productTypeId: String(onlyType.id),
        shelfLifeDays: onlyType.shelfLifeDays != null ? String(onlyType.shelfLifeDays) : "",
        shelfLifeHours: onlyType.shelfLifeHours != null ? String(onlyType.shelfLifeHours) : "",
      });
      return;
    }

    setForm(initialForm);
  }, [open, productTypes]);

  const buildDto = (): CreateProductDto | null => {
    const result = validateCreateProduct({
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
      await createProduct(dto);
      toast.success("Продукт створено");
      onCreated();
      onClose();
      setForm(initialForm);
    } catch (error) {
      showErrorToast(error, "Не вдалося створити продукт");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Створити продукт</DialogTitle>
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
            Значення терміну придатності підтягуються з типу продукту, але їх можна змінити вручну.
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Скасувати
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Створення..." : "Створити"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
