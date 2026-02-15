"use client";

import { useState } from "react";
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

export function EditProductDialog({
  product,
  open,
  onClose,
  onUpdated,
  productTypes,
}: EditProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateProductDto>({
    name: product.name,
    description: product.description,
    productTypeId: product.productTypeId,
    shelfLifeDays: product.shelfLifeDays,
    shelfLifeHours: product.shelfLifeHours,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      await updateProduct(product.id, formData);
      toast.success("Продукт оновлено");
      onUpdated();
      onClose();
    } catch (error) {
      toast.error("Не вдалося оновити продукт");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редагувати продукт</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Назва</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productType">Тип продукту</Label>
            <Select
              value={formData.productTypeId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, productTypeId: value }))
              }
            >
              <SelectTrigger id="productType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {productTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Опис (опціонально)</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value || null,
                }))
              }
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shelfLifeDays">Термін (днів)</Label>
              <Input
                id="shelfLifeDays"
                type="number"
                value={formData.shelfLifeDays || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shelfLifeDays: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shelfLifeHours">Термін (годин)</Label>
              <Input
                id="shelfLifeHours"
                type="number"
                value={formData.shelfLifeHours || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shelfLifeHours: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
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
