"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function FillContainerDialog({
  container,
  open,
  onClose,
  onSuccess,
}: FillContainerDialogProps) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FillContainerDto>({
    productId: "",
    quantity: container.volume,
    unit: container.unit,
    productionDate: new Date().toISOString().split("T")[0],
    expirationDate: null,
  });

  useEffect(() => {
    if (open) {
      getProducts()
        .then(setProducts)
        .catch(() => toast.error("Не вдалося завантажити продукти"));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId) {
      toast.error("Оберіть продукт");
      return;
    }

    setLoading(true);
    try {
      await fillContainer(container.id, formData);
      toast.success("Контейнер заповнено");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Не вдалося заповнити контейнер");
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setFormData((prev) => {
      const newData = { ...prev, productId };
      
      if (product && (product.shelfLifeDays || product.shelfLifeHours)) {
        const prodDate = new Date(prev.productionDate);
        if (product.shelfLifeDays) {
          prodDate.setDate(prodDate.getDate() + product.shelfLifeDays);
        }
        if (product.shelfLifeHours) {
          prodDate.setHours(prodDate.getHours() + product.shelfLifeHours);
        }
        newData.expirationDate = prodDate.toISOString().split("T")[0];
      }
      
      return newData;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Заповнити контейнер {container.code}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Продукт</Label>
            <Select
              value={formData.productId}
              onValueChange={handleProductChange}
            >
              <SelectTrigger id="product">
                <SelectValue placeholder="Оберіть продукт" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.productTypeName})
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
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: parseFloat(e.target.value),
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Одиниця</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, unit: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productionDate">Дата виробництва</Label>
            <Input
              id="productionDate"
              type="date"
              value={formData.productionDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  productionDate: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDate">Термін придатності</Label>
            <Input
              id="expirationDate"
              type="date"
              value={formData.expirationDate || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  expirationDate: e.target.value || null,
                }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
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
