"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProduct } from "@/shared/api/products";
import type { CreateProductDto, ProductTypeDto } from "@/shared/types";
import { toast } from "sonner";

interface CreateProductDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  productTypes: ProductTypeDto[];
}

export function CreateProductDialog({
  open,
  onClose,
  onCreated,
  productTypes,
}: CreateProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProductDto>({
    name: "",
    description: null,
    productTypeId: "",
    shelfLifeDays: null,
    shelfLifeHours: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productTypeId) {
      toast.error("Оберіть тип продукту");
      return;
    }

    setLoading(true);
    try {
      await createProduct(formData);
      toast.success("Продукт створено");
      onCreated();
      onClose();
      setFormData({
        name: "",
        description: null,
        productTypeId: "",
        shelfLifeDays: null,
        shelfLifeHours: null,
      });
    } catch (error) {
      toast.error("Не вдалося створити продукт");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Створити продукт</DialogTitle>
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
                <SelectValue placeholder="Оберіть тип продукту" />
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
              {loading ? "Створення..." : "Створити"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
